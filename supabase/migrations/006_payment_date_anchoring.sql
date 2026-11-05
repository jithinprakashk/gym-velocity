-- Anchor membership validity to the earliest approved payment date.
-- Late payments are recorded and flagged when paid after membership start.

alter table public.payments add column if not exists is_delayed boolean not null default false;
alter table public.payment_claims add column if not exists is_delayed boolean not null default false;

create or replace function public.submit_payment_claim(
  p_membership_id uuid, p_amount numeric, p_method text, p_paid_on date, p_reference text, p_notes text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_member uuid; v_id uuid;
begin
  v_member := public.my_member_id();
  if v_member is null then raise exception 'Your member record is not approved yet'; end if;
  if not exists (select 1 from public.memberships where id = p_membership_id and member_id = v_member) then
    raise exception 'Membership not found';
  end if;
  if p_amount <= 0 then raise exception 'Enter an amount above zero'; end if;
  if p_paid_on > (now() at time zone 'Asia/Kolkata')::date then raise exception 'Payment date cannot be in the future'; end if;
  insert into public.payment_claims (member_id, membership_id, amount, method, paid_on, reference, notes, is_delayed)
  select v_member, m.id, p_amount, p_method, p_paid_on, nullif(trim(p_reference), ''), nullif(trim(p_notes), ''),
         p_paid_on > m.start_date
    from public.memberships m where m.id = p_membership_id
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.submit_payment_claim(uuid, numeric, text, date, text, text) to authenticated;

create or replace view public.membership_financials with (security_invoker = true) as
select m.*,
       coalesce(p.paid, 0) as paid,
       m.amount_payable - coalesce(p.paid, 0) as outstanding,
       p.first_payment_date,
       coalesce(p.first_payment_date, m.start_date) as effective_start_date,
       case when m.model = 'calendar' and m.end_date is not null
            then m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date)
            else m.end_date end as effective_end_date,
       case when m.model = 'calendar' and m.end_date is not null
            then greatest(
              (m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date)
                - (now() at time zone 'Asia/Kolkata')::date), 0)
            else null end as days_remaining,
       case when m.status = 'active' and m.model = 'calendar'
                 and (m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date))
                   < (now() at time zone 'Asia/Kolkata')::date
            then 'expired' else m.status end as effective_status
from public.memberships m
left join (
  select membership_id, sum(amount) as paid, min(paid_on) as first_payment_date
  from public.payments
  where status = 'valid'
  group by membership_id
) p on p.membership_id = m.id;

create or replace function public.official_attendance_days(p_membership_id uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer
    from public.official_attendance a
    join public.memberships m on m.id = p_membership_id and m.member_id = a.member_id
    left join (
      select membership_id, min(paid_on) as first_payment_date
      from public.payments where status = 'valid' group by membership_id
    ) pay on pay.membership_id = m.id
   where m.model = 'working_days'
     and a.status = 'present'
     and a.attendance_date >= coalesce(pay.first_payment_date, m.start_date)
     and a.attendance_date < coalesce(
       (select min(next_m.start_date) from public.memberships next_m
         where next_m.member_id = m.member_id and next_m.start_date > m.start_date),
       '9999-12-31'::date
     )
     and not public.is_gym_closed(a.attendance_date);
$$;

create or replace function public.record_payment(
  p_membership_id uuid, p_amount numeric, p_method text, p_paid_on date, p_reference text, p_remarks text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare m record; v_paid numeric; v_out numeric; v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into m from public.memberships where id = p_membership_id for update;
  if not found then raise exception 'Membership not found'; end if;
  if m.status = 'cancelled' then raise exception 'Cannot take a payment for a cancelled membership'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount above zero'; end if;
  if p_paid_on > (now() at time zone 'Asia/Kolkata')::date then raise exception 'Payment date cannot be in the future'; end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where membership_id = m.id and status = 'valid';
  v_out := m.amount_payable - v_paid;
  if p_amount > v_out then raise exception 'Payment (Rs %) is more than the balance due (Rs %)', p_amount, v_out; end if;
  insert into public.payments (member_id, membership_id, amount, method, paid_on, reference, remarks, is_delayed, created_by)
  values (m.member_id, m.id, p_amount, p_method, p_paid_on, nullif(trim(p_reference), ''),
    nullif(trim(p_remarks), ''), p_paid_on > m.start_date, auth.uid())
  returning id into v_id;
  perform public.write_audit('payment.create', 'payments', v_id, null,
    jsonb_build_object('membership_id', m.id, 'amount', p_amount, 'method', p_method, 'is_delayed', p_paid_on > m.start_date));
  return v_id;
end $$;
