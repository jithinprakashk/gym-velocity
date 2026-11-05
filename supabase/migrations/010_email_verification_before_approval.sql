-- Require email verification before a public registration can be approved.

create or replace function public.approve_registration(p_request_id uuid, p_plan_id uuid, p_fee numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r record;
  p record;
  v_member uuid;
  v_membership uuid;
  v_start date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into r from public.member_registration_requests where id = p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'Registration request is not pending'; end if;
  if not exists (
    select 1 from auth.users u
    where u.id = r.profile_id and u.email_confirmed_at is not null
  ) then
    raise exception 'The member must verify their email before approval';
  end if;
  select * into p from public.membership_plans
   where id = coalesce(p_plan_id, r.requested_plan_id) and is_active;
  if not found then raise exception 'Choose an active membership plan'; end if;
  update public.profiles set approval_status = 'approved', is_active = true where id = r.profile_id;
  v_member := public.create_member_record(r.profile_id,
    (select full_name from public.profiles where id = r.profile_id),
    (select phone from public.profiles where id = r.profile_id), r.address, v_start);
  v_membership := public.create_membership(v_member, p.id, p.model, v_start,
    case when p.model = 'calendar' then (v_start + make_interval(months => p.duration_months) - interval '1 day')::date end,
    p.total_days, coalesce(p_fee, p.default_fee), 0, 0, null);
  update public.member_registration_requests
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   where id = r.id;
  return v_member;
end $$;

grant execute on function public.approve_registration(uuid, uuid, numeric) to authenticated;
