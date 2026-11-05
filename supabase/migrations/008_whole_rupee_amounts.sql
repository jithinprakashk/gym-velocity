-- Store all money values as whole Indian rupees.

update public.memberships
set fee = round(fee), discount = round(discount), extra_charges = round(extra_charges);
update public.membership_plans
set default_fee = round(default_fee);
update public.payments
set amount = round(amount);
update public.payment_claims
set amount = round(amount);

-- These views depend on the money columns and must be recreated after the
-- column types change.
drop view if exists public.current_memberships;
drop view if exists public.membership_financials;

alter table public.memberships
  drop column amount_payable;

alter table public.memberships
  alter column fee type numeric(10,0) using round(fee),
  alter column discount type numeric(10,0) using round(discount),
  alter column extra_charges type numeric(10,0) using round(extra_charges);

alter table public.memberships
  add column amount_payable numeric(10,0)
    generated always as (fee - discount + extra_charges) stored;

alter table public.membership_plans
  alter column default_fee type numeric(10,0) using round(default_fee);

alter table public.payments
  alter column amount type numeric(10,0) using round(amount);

alter table public.payment_claims
  alter column amount type numeric(10,0) using round(amount);

create or replace view public.membership_financials with (security_invoker = true) as
select m.*,
       coalesce(p.paid, 0) as paid,
       m.amount_payable - coalesce(p.paid, 0) as outstanding,
       case when m.status = 'active' and m.model = 'calendar'
                 and m.end_date is not null
                 and (m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date))
                   < (now() at time zone 'Asia/Kolkata')::date
             then 'expired' else m.status end as effective_status,
       p.first_payment_date,
       coalesce(p.first_payment_date, m.start_date) as effective_start_date,
       case when m.model = 'calendar' and m.end_date is not null
            then m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date)
            else m.end_date end as effective_end_date,
       case when m.model = 'calendar' and m.end_date is not null
            then greatest(
              (m.end_date + (coalesce(p.first_payment_date, m.start_date) - m.start_date)
                - (now() at time zone 'Asia/Kolkata')::date), 0)
            else null end as days_remaining
from public.memberships m
left join (
  select membership_id, sum(amount) as paid, min(paid_on) as first_payment_date
  from public.payments
  where status = 'valid'
  group by membership_id
) p on p.membership_id = m.id;

create or replace view public.current_memberships with (security_invoker = true) as
select distinct on (member_id) *
from public.membership_financials
where status <> 'cancelled'
order by member_id, (status = 'active') desc, start_date desc, created_at desc;

create or replace function public.record_payment(
  p_membership_id uuid, p_amount numeric, p_method text, p_paid_on date, p_reference text, p_remarks text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare m record; v_paid numeric; v_out numeric; v_amount numeric := round(p_amount); v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into m from public.memberships where id = p_membership_id for update;
  if not found then raise exception 'Membership not found'; end if;
  if m.status = 'cancelled' then raise exception 'Cannot take a payment for a cancelled membership'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> v_amount then
    raise exception 'Payment amount must be a whole rupee amount';
  end if;
  if p_paid_on > (now() at time zone 'Asia/Kolkata')::date then raise exception 'Payment date cannot be in the future'; end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where membership_id = m.id and status = 'valid';
  v_out := m.amount_payable - v_paid;
  if v_amount > v_out then raise exception 'Payment (Rs %) is more than the balance due (Rs %)', v_amount, v_out; end if;
  insert into public.payments (member_id, membership_id, amount, method, paid_on, reference, remarks, is_delayed, created_by)
  values (m.member_id, m.id, v_amount, p_method, p_paid_on, nullif(trim(p_reference), ''),
    nullif(trim(p_remarks), ''), p_paid_on > m.start_date, auth.uid())
  returning id into v_id;
  perform public.write_audit('payment.create', 'payments', v_id, null,
    jsonb_build_object('membership_id', m.id, 'amount', v_amount, 'method', p_method, 'is_delayed', p_paid_on > m.start_date));
  return v_id;
end $$;
