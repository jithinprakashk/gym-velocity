-- Members report that the full membership amount was paid.
-- Admins choose the actual payment date when reviewing the claim.

alter table public.payment_claims
  alter column paid_on drop not null;

drop function if exists public.review_payment_claim(uuid, text);
drop function if exists public.submit_payment_claim(uuid, numeric, text, date, text, text);

create or replace function public.submit_payment_claim(
  p_membership_id uuid, p_method text, p_reference text, p_notes text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_member uuid;
  v_id uuid;
  v_amount numeric;
begin
  v_member := public.my_member_id();
  if v_member is null then raise exception 'Your member record is not approved yet'; end if;
  select amount_payable into v_amount
    from public.memberships
   where id = p_membership_id and member_id = v_member and status <> 'cancelled'
   for update;
  if not found then raise exception 'Membership not found'; end if;
  if exists (select 1 from public.payments where membership_id = p_membership_id and status = 'valid') then
    raise exception 'This membership is already paid';
  end if;
  if exists (select 1 from public.payment_claims where membership_id = p_membership_id and status = 'pending') then
    raise exception 'A payment claim is already pending';
  end if;
  insert into public.payment_claims (member_id, membership_id, amount, method, reference, notes)
  values (v_member, p_membership_id, v_amount, p_method, nullif(trim(p_reference), ''), nullif(trim(p_notes), ''))
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.submit_payment_claim(uuid, text, text, text) to authenticated;

create or replace function public.review_payment_claim(
  p_claim_id uuid, p_status text, p_paid_on date
) returns void language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
  if p_status = 'approved' and p_paid_on is null then raise exception 'Choose the payment date'; end if;
  if p_paid_on > (now() at time zone 'Asia/Kolkata')::date then raise exception 'Payment date cannot be in the future'; end if;
  select * into c from public.payment_claims where id = p_claim_id for update;
  if not found or c.status <> 'pending' then raise exception 'Payment claim is not pending'; end if;
  if p_status = 'approved' then
    perform public.record_payment(c.membership_id, c.amount, c.method, p_paid_on, c.reference, c.notes);
  end if;
  update public.payment_claims
     set status = p_status, paid_on = case when p_status = 'approved' then p_paid_on else paid_on end,
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = c.id;
end $$;
grant execute on function public.review_payment_claim(uuid, text, date) to authenticated;
