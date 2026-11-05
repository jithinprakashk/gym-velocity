-- Member/admin attendance comparison, exercise library and public gallery.

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  exercise_type text not null check (exercise_type in ('workout', 'attendance', 'missed_day')),
  category text not null check (category in ('upper_body', 'lower_body', 'full_body', 'cardio', 'custom')),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger exercise_library_updated_at before update on public.exercise_library
  for each row execute function public.set_updated_at();
alter table public.exercise_library enable row level security;
create policy "authenticated reads exercise library" on public.exercise_library for select to authenticated
  using (active or public.is_admin());
create policy "admins manage exercise library" on public.exercise_library for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin reads diary" on public.workout_diary for select to authenticated
  using (public.is_admin());

alter table public.workout_diary add column if not exists library_id uuid references public.exercise_library(id);

create or replace view public.attendance_mismatches as
select
  coalesce(a.member_id, d.member_id) as member_id,
  coalesce(a.attendance_date, d.activity_date) as activity_date,
  a.status as admin_status,
  d.category as member_category,
  d.exercise_details,
  m.member_code,
  p.full_name
from public.official_attendance a
full join public.workout_diary d
  on d.member_id = a.member_id and d.activity_date = a.attendance_date
join public.members m on m.id = coalesce(a.member_id, d.member_id)
join public.profiles p on p.id = m.profile_id
where (a.status = 'present' and d.category in ('rest_day', 'missed'))
   or (a.status = 'absent' and d.category not in ('rest_day', 'missed'))
   or (a.id is null and d.category not in ('rest_day', 'missed'))
   or (a.id is not null and d.id is null and a.status = 'present');
alter view public.attendance_mismatches set (security_invoker = true);
grant select on public.attendance_mismatches to authenticated;

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  title text not null default '' check (length(title) <= 160),
  sort_order integer not null default 0,
  active boolean not null default true,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.gallery_images enable row level security;
create policy "public reads active gallery" on public.gallery_images for select to anon, authenticated using (active or public.is_admin());
create policy "admins manage gallery" on public.gallery_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;
create policy "public reads gallery files" on storage.objects for select
  using (bucket_id = 'gallery');
create policy "admins upload gallery files" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_admin());
create policy "admins update gallery files" on storage.objects for update to authenticated
  using (bucket_id = 'gallery' and public.is_admin());
create policy "admins delete gallery files" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_admin());
