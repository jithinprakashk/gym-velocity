-- VELOCITY Phase 5: member self-registration and payment claims.
-- Run after 004_phase3_attendance_diary.sql.

alter table public.profiles
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected'));

create table public.member_registration_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  requested_plan_id uuid references public.membership_plans(id),
  address text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_claims (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  membership_id uuid not null,
  amount numeric(10,2) not null check (amount > 0),
  method text not null check (method in ('cash','upi','bank','other')),
  paid_on date not null,
  reference text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (membership_id, member_id) references public.memberships(id, member_id)
);

alter table public.member_registration_requests enable row level security;
alter table public.payment_claims enable row level security;
create policy "admin manages registration requests" on public.member_registration_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "member reads own registration request" on public.member_registration_requests
  for select to authenticated using (profile_id = auth.uid());
create policy "admin manages payment claims" on public.payment_claims
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "member reads own payment claims" on public.payment_claims
  for select to authenticated using (member_id = public.my_member_id());
create policy "member submits own payment claims" on public.payment_claims
  for insert to authenticated with check (member_id = public.my_member_id());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_plan uuid;
begin
  insert into public.profiles (id, role, full_name, phone, approval_status)
  values (new.id, 'member', coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.raw_user_meta_data ->> 'phone', ''), 'pending')
  on conflict (id) do nothing;
  begin v_plan := (new.raw_user_meta_data ->> 'plan_id')::uuid; exception when others then v_plan := null; end;
  insert into public.member_registration_requests (profile_id, requested_plan_id, address)
  values (new.id, v_plan, nullif(new.raw_user_meta_data ->> 'address', ''))
  on conflict (profile_id) do nothing;
  return new;
end $$;

create or replace function public.approve_registration(p_request_id uuid, p_plan_id uuid, p_fee numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r record; p record; v_member uuid; v_membership uuid; v_start date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into r from public.member_registration_requests where id = p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'Registration request is not pending'; end if;
  select * into p from public.membership_plans where id = coalesce(p_plan_id, r.requested_plan_id) and is_active;
  if not found then raise exception 'Choose an active membership plan'; end if;
  update public.profiles set approval_status = 'approved', is_active = true where id = r.profile_id;
  v_member := public.create_member_record(r.profile_id, (select full_name from public.profiles where id = r.profile_id),
    (select phone from public.profiles where id = r.profile_id), r.address, v_start);
  v_membership := public.create_membership(v_member, p.id, p.model, v_start,
    case when p.model = 'calendar' then (v_start + make_interval(months => p.duration_months) - interval '1 day')::date end,
    p.total_days, coalesce(p_fee, p.default_fee), 0, 0, null);
  update public.member_registration_requests set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = r.id;
  return v_member;
end $$;
grant execute on function public.approve_registration(uuid, uuid, numeric) to authenticated;

create or replace function public.review_payment_claim(p_claim_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
  select * into c from public.payment_claims where id = p_claim_id for update;
  if not found or c.status <> 'pending' then raise exception 'Payment claim is not pending'; end if;
  if p_status = 'approved' then
    perform public.record_payment(c.membership_id, c.amount, c.method, c.paid_on, c.reference, c.notes);
  end if;
  update public.payment_claims set status = p_status, reviewed_by = auth.uid(), reviewed_at = now() where id = c.id;
end $$;
grant execute on function public.review_payment_claim(uuid, text) to authenticated;
