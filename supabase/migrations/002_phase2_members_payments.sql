-- VELOCITY Phase 2: members, memberships, payments, audit log, admin functions.
-- Run AFTER 001. SQL Editor -> New query -> paste -> Run.
-- Money and membership changes happen ONLY through the functions below (each checks is_admin()).

create sequence if not exists public.member_code_seq start 1;

create table public.members (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null unique references public.profiles(id),
  member_code  text not null unique default ('VEL-' || lpad(nextval('public.member_code_seq')::text, 4, '0')),
  address      text,
  joined_on    date not null default ((now() at time zone 'Asia/Kolkata')::date),
  status       text not null default 'active' check (status in ('active','inactive','suspended','expired')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger members_updated_at before update on public.members
  for each row execute function public.set_updated_at();

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members(id),
  plan_id         uuid references public.membership_plans(id),
  model           text not null check (model in ('calendar','working_days')),
  start_date      date not null,
  end_date        date,
  total_days      integer check (total_days > 0),
  fee             numeric(10,2) not null check (fee >= 0),
  discount        numeric(10,2) not null default 0 check (discount >= 0),
  extra_charges   numeric(10,2) not null default 0 check (extra_charges >= 0),
  amount_payable  numeric(10,2) generated always as (fee - discount + extra_charges) stored,
  status          text not null default 'active' check (status in ('active','closed','cancelled')),
  renewed_from_id uuid references public.memberships(id),
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, member_id),
  constraint membership_model_fields check (
    (model = 'calendar' and end_date is not null and end_date >= start_date)
    or (model = 'working_days' and total_days is not null)
  ),
  constraint membership_not_negative check (fee - discount + extra_charges >= 0)
);
create index memberships_member_idx on public.memberships(member_id, start_date desc);
create trigger memberships_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references public.members(id),
  membership_id    uuid not null,
  amount           numeric(10,2) not null check (amount > 0),
  method           text not null check (method in ('cash','upi','bank','other')),
  paid_on          date not null,
  reference        text,
  remarks          text,
  status           text not null default 'valid' check (status in ('valid','reversed')),
  reversed_at      timestamptz,
  reversed_by      uuid references public.profiles(id),
  reversal_reason  text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  foreign key (membership_id, member_id) references public.memberships(id, member_id)
);
create index payments_membership_idx on public.payments(membership_id);
create index payments_paid_on_idx on public.payments(paid_on);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_record_idx on public.audit_logs(table_name, record_id);

-- Helpers ---------------------------------------------------------------
create or replace function public.my_member_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.members where profile_id = auth.uid();
$$;
grant execute on function public.my_member_id() to authenticated;

create or replace function public.write_audit(p_action text, p_table text, p_record uuid, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), p_action, p_table, p_record, p_old, p_new);
$$;
revoke execute on function public.write_audit(text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

-- Views (respect the caller's security rules) ------------------------------
create or replace view public.membership_financials with (security_invoker = true) as
select m.*,
       coalesce(p.paid, 0) as paid,
       m.amount_payable - coalesce(p.paid, 0) as outstanding,
       case when m.status = 'active' and m.model = 'calendar'
                 and m.end_date < (now() at time zone 'Asia/Kolkata')::date
            then 'expired' else m.status end as effective_status
from public.memberships m
left join (select membership_id, sum(amount) as paid from public.payments
           where status = 'valid' group by membership_id) p on p.membership_id = m.id;

-- The membership that currently "counts" for each member
create or replace view public.current_memberships with (security_invoker = true) as
select distinct on (member_id) *
from public.membership_financials
where status <> 'cancelled'
order by member_id, (status = 'active') desc, start_date desc, created_at desc;

-- Row Level Security ---------------------------------------------------------
alter table public.members     enable row level security;
alter table public.memberships enable row level security;
alter table public.payments    enable row level security;
alter table public.audit_logs  enable row level security;

create policy "read own or admin" on public.members for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "read own or admin" on public.memberships for select to authenticated
  using (member_id = public.my_member_id() or public.is_admin());
create policy "read own or admin" on public.payments for select to authenticated
  using (member_id = public.my_member_id() or public.is_admin());
create policy "admin reads audit" on public.audit_logs for select to authenticated
  using (public.is_admin());
-- No insert/update/delete policies: nobody changes these tables directly through the API.

-- Admin functions -------------------------------------------------------------
create or replace function public.create_member_record(
  p_user_id uuid, p_full_name text, p_phone text, p_address text, p_joined_on date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if coalesce(trim(p_full_name), '') = '' then raise exception 'Member name is required'; end if;
  update public.profiles set full_name = trim(p_full_name), phone = nullif(trim(p_phone), '')
   where id = p_user_id and role = 'member';
  if not found then raise exception 'Login account not found'; end if;
  insert into public.members (profile_id, address, joined_on)
  values (p_user_id, nullif(trim(p_address), ''), coalesce(p_joined_on, (now() at time zone 'Asia/Kolkata')::date))
  returning id into v_id;
  perform public.write_audit('member.create', 'members', v_id, null, jsonb_build_object('profile_id', p_user_id));
  return v_id;
end $$;

create or replace function public.update_member_details(
  p_member_id uuid, p_full_name text, p_phone text, p_address text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if coalesce(trim(p_full_name), '') = '' then raise exception 'Member name is required'; end if;
  select jsonb_build_object('full_name', p.full_name, 'phone', p.phone, 'address', m.address) into v_old
    from public.members m join public.profiles p on p.id = m.profile_id where m.id = p_member_id;
  if v_old is null then raise exception 'Member not found'; end if;
  update public.profiles set full_name = trim(p_full_name), phone = nullif(trim(p_phone), '')
   where id = (select profile_id from public.members where id = p_member_id);
  update public.members set address = nullif(trim(p_address), '') where id = p_member_id;
  perform public.write_audit('member.update', 'members', p_member_id, v_old,
    jsonb_build_object('full_name', trim(p_full_name), 'phone', p_phone, 'address', p_address));
end $$;

-- Deactivating never deletes anything. inactive/suspended also block sign-in.
create or replace function public.set_member_status(p_member_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old text;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status not in ('active','inactive','suspended','expired') then raise exception 'Invalid status'; end if;
  select status into v_old from public.members where id = p_member_id;
  if v_old is null then raise exception 'Member not found'; end if;
  update public.members set status = p_status where id = p_member_id;
  update public.profiles set is_active = (p_status in ('active','expired'))
   where id = (select profile_id from public.members where id = p_member_id);
  perform public.write_audit('member.status', 'members', p_member_id,
    jsonb_build_object('status', v_old), jsonb_build_object('status', p_status));
end $$;

-- New or renewed membership. Old rows are kept; a previous active one is marked closed.
create or replace function public.create_membership(
  p_member_id uuid, p_plan_id uuid, p_model text, p_start date, p_end date, p_total_days integer,
  p_fee numeric, p_discount numeric, p_extra numeric, p_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_prev uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.members where id = p_member_id) then raise exception 'Member not found'; end if;
  if p_model = 'calendar' and (p_end is null or p_end < p_start) then
    raise exception 'The end date must be on or after the start date'; end if;
  if p_model = 'working_days' and coalesce(p_total_days, 0) < 1 then
    raise exception 'Enter the number of gym days'; end if;
  if p_discount > p_fee + p_extra then raise exception 'Discount cannot be more than the fee plus extra charges'; end if;

  select id into v_prev from public.memberships
   where member_id = p_member_id and status = 'active' order by start_date desc limit 1;
  update public.memberships set status = 'closed' where member_id = p_member_id and status = 'active';

  insert into public.memberships (member_id, plan_id, model, start_date, end_date, total_days,
                                  fee, discount, extra_charges, renewed_from_id, notes, created_by)
  values (p_member_id, p_plan_id, p_model, p_start,
          case when p_model = 'calendar' then p_end end,
          case when p_model = 'working_days' then p_total_days end,
          p_fee, coalesce(p_discount, 0), coalesce(p_extra, 0), v_prev, nullif(trim(p_notes), ''), auth.uid())
  returning id into v_id;
  perform public.write_audit('membership.create', 'memberships', v_id, null,
    jsonb_build_object('member_id', p_member_id, 'model', p_model, 'fee', p_fee, 'renewed_from', v_prev));
  return v_id;
end $$;

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
  if p_amount > v_out then
    raise exception 'Payment (Rs %) is more than the balance due (Rs %)', p_amount, v_out; end if;
  insert into public.payments (member_id, membership_id, amount, method, paid_on, reference, remarks, created_by)
  values (m.member_id, m.id, p_amount, p_method, p_paid_on, nullif(trim(p_reference), ''), nullif(trim(p_remarks), ''), auth.uid())
  returning id into v_id;
  perform public.write_audit('payment.create', 'payments', v_id, null,
    jsonb_build_object('membership_id', m.id, 'amount', p_amount, 'method', p_method));
  return v_id;
end $$;

-- Payments are never deleted. A wrong one is reversed with a reason and stays in history.
create or replace function public.reverse_payment(p_payment_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Please give a reason for the reversal'; end if;
  select * into p from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if p.status = 'reversed' then raise exception 'This payment is already reversed'; end if;
  update public.payments set status = 'reversed', reversed_at = now(), reversed_by = auth.uid(),
         reversal_reason = trim(p_reason) where id = p_payment_id;
  perform public.write_audit('payment.reverse', 'payments', p_payment_id,
    jsonb_build_object('status', 'valid', 'amount', p.amount),
    jsonb_build_object('status', 'reversed', 'reason', trim(p_reason)));
end $$;

create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_today date := (now() at time zone 'Asia/Kolkata')::date; r jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'total_members',    (select count(*) from public.members),
    'active_members',   (select count(*) from public.members where status = 'active'),
    'inactive_members', (select count(*) from public.members where status in ('inactive','suspended')),
    'expired_memberships', (select count(*) from public.current_memberships where effective_status = 'expired'),
    'expiring_soon',    (select count(*) from public.current_memberships
                          where effective_status = 'active' and model = 'calendar'
                            and end_date between v_today and v_today + 7),
    'pending_members',  (select count(distinct member_id) from public.membership_financials
                          where status <> 'cancelled' and outstanding > 0),
    'pending_amount',   (select coalesce(sum(outstanding), 0) from public.membership_financials
                          where status <> 'cancelled' and outstanding > 0),
    'monthly_collections', (select coalesce(sum(amount), 0) from public.payments
                          where status = 'valid' and paid_on >= date_trunc('month', v_today)::date)
  ) into r;
  return r;
end $$;

-- Only signed-in users may call these (each also checks is_admin inside).
revoke execute on function public.create_member_record(uuid,text,text,text,date) from public, anon;
revoke execute on function public.update_member_details(uuid,text,text,text) from public, anon;
revoke execute on function public.set_member_status(uuid,text) from public, anon;
revoke execute on function public.create_membership(uuid,uuid,text,date,date,integer,numeric,numeric,numeric,text) from public, anon;
revoke execute on function public.record_payment(uuid,numeric,text,date,text,text) from public, anon;
revoke execute on function public.reverse_payment(uuid,text) from public, anon;
revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.create_member_record(uuid,text,text,text,date) to authenticated;
grant execute on function public.update_member_details(uuid,text,text,text) to authenticated;
grant execute on function public.set_member_status(uuid,text) to authenticated;
grant execute on function public.create_membership(uuid,uuid,text,date,date,integer,numeric,numeric,numeric,text) to authenticated;
grant execute on function public.record_payment(uuid,numeric,text,date,text,text) to authenticated;
grant execute on function public.reverse_payment(uuid,text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
