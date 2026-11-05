-- VELOCITY Phase 3: holidays, official attendance and member workout diary.
-- Run after 001_phase1_core.sql, 002_phase2_members_payments.sql and 003_phone_rules.sql.

create table public.gym_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  title text not null check (length(trim(title)) between 1 and 160),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger holidays_updated_at before update on public.gym_holidays
  for each row execute function public.set_updated_at();

create table public.official_attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id),
  attendance_date date not null,
  status text not null check (status in ('present', 'absent')),
  marked_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, attendance_date)
);
create index official_attendance_date_idx on public.official_attendance(attendance_date);
create index official_attendance_member_idx on public.official_attendance(member_id, attendance_date desc);
create trigger official_attendance_updated_at before update on public.official_attendance
  for each row execute function public.set_updated_at();

create table public.workout_diary (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  activity_date date not null,
  category text not null check (category in ('upper_body','lower_body','full_body','cardio','custom','rest_day','missed')),
  title text,
  exercise_details text,
  sets integer check (sets is null or sets > 0),
  repetitions integer check (repetitions is null or repetitions > 0),
  weight_kg numeric(8,2) check (weight_kg is null or weight_kg >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, activity_date)
);
create index workout_diary_member_date_idx on public.workout_diary(member_id, activity_date desc);
create trigger workout_diary_updated_at before update on public.workout_diary
  for each row execute function public.set_updated_at();

alter table public.gym_holidays enable row level security;
alter table public.official_attendance enable row level security;
alter table public.workout_diary enable row level security;

create policy "public reads holidays" on public.gym_holidays for select to anon, authenticated using (true);
create policy "admin reads attendance" on public.official_attendance for select to authenticated using (public.is_admin());
create policy "member reads own attendance" on public.official_attendance for select to authenticated
  using (member_id = public.my_member_id());
create policy "member reads own diary" on public.workout_diary for select to authenticated
  using (member_id = public.my_member_id());
create policy "member creates own diary" on public.workout_diary for insert to authenticated
  with check (member_id = public.my_member_id());
create policy "member updates own diary" on public.workout_diary for update to authenticated
  using (member_id = public.my_member_id()) with check (member_id = public.my_member_id());
create policy "member deletes own diary" on public.workout_diary for delete to authenticated
  using (member_id = public.my_member_id());

create or replace function public.is_gym_closed(p_date date)
returns boolean language sql stable security definer set search_path = '' as $$
  select extract(isodow from p_date) = 7
      or exists (select 1 from public.gym_holidays where holiday_date = p_date);
$$;
grant execute on function public.is_gym_closed(date) to anon, authenticated;

create or replace function public.mark_official_attendance(
  p_member_id uuid, p_date date, p_status text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_old jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status not in ('present', 'absent') then raise exception 'Invalid attendance status'; end if;
  if public.is_gym_closed(p_date) then raise exception 'Attendance cannot be recorded on Sundays or gym holidays'; end if;
  if not exists (select 1 from public.members where id = p_member_id) then raise exception 'Member not found'; end if;

  select jsonb_build_object('status', status, 'attendance_date', attendance_date)
    into v_old from public.official_attendance
   where member_id = p_member_id and attendance_date = p_date for update;

  insert into public.official_attendance (member_id, attendance_date, status, marked_by)
  values (p_member_id, p_date, p_status, auth.uid())
  on conflict (member_id, attendance_date)
  do update set status = excluded.status, marked_by = excluded.marked_by, updated_at = now()
  returning id into v_id;

  perform public.write_audit(
    case when v_old is null then 'attendance.create' else 'attendance.update' end,
    'official_attendance', v_id, v_old,
    jsonb_build_object('member_id', p_member_id, 'attendance_date', p_date, 'status', p_status)
  );
  return v_id;
end $$;
grant execute on function public.mark_official_attendance(uuid, date, text) to authenticated;

create or replace function public.add_gym_holiday(
  p_date date, p_title text, p_confirm_attendance boolean default false
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if extract(isodow from p_date) = 7 then raise exception 'Sundays are already closed and cannot be added as holidays'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Holiday title is required'; end if;
  select count(*) into v_count from public.official_attendance where attendance_date = p_date;
  if v_count > 0 and not p_confirm_attendance then
    raise exception 'This date has % attendance record(s). Confirming will preserve them and reverse working-day consumption.', v_count;
  end if;

  insert into public.gym_holidays (holiday_date, title, created_by)
  values (p_date, trim(p_title), auth.uid())
  on conflict (holiday_date) do update set title = excluded.title, updated_at = now()
  returning id into v_id;
  perform public.write_audit('holiday.upsert', 'gym_holidays', v_id, null,
    jsonb_build_object('holiday_date', p_date, 'title', trim(p_title), 'attendance_count', v_count));
  return v_count;
end $$;
grant execute on function public.add_gym_holiday(date, text, boolean) to authenticated;

create or replace function public.remove_gym_holiday(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select to_jsonb(h) into v_old from public.gym_holidays h where id = p_id for update;
  if v_old is null then raise exception 'Holiday not found'; end if;
  delete from public.gym_holidays where id = p_id;
  perform public.write_audit('holiday.delete', 'gym_holidays', p_id, v_old, null);
end $$;
grant execute on function public.remove_gym_holiday(uuid) to authenticated;

create or replace function public.official_attendance_days(p_membership_id uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer
    from public.official_attendance a
    join public.memberships m on m.id = p_membership_id and m.member_id = a.member_id
   where m.model = 'working_days'
     and a.status = 'present'
     and a.attendance_date >= m.start_date
     and a.attendance_date < coalesce(
       (select min(next_m.start_date) from public.memberships next_m
         where next_m.member_id = m.member_id and next_m.start_date > m.start_date),
       '9999-12-31'::date
     )
     and not public.is_gym_closed(a.attendance_date);
$$;
grant execute on function public.official_attendance_days(uuid) to authenticated;

create or replace view public.membership_usage with (security_invoker = true) as
select m.id as membership_id, m.member_id, m.model, m.total_days,
       case when m.model = 'working_days' then public.official_attendance_days(m.id) else 0 end as days_used,
       case when m.model = 'working_days'
            then greatest(m.total_days - public.official_attendance_days(m.id), 0)
            else null end as days_remaining
from public.memberships m;
