-- VELOCITY Phase 1: profiles, roles, public plans, public settings.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- Shared helper: keep updated_at current
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- 1. PROFILES (one per login). Role lives here, never in client input.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('admin','member')),
  full_name   text not null default '',
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- 2. is_admin(): used by every security policy
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 3. New login -> profile, always as 'member'. Metadata is user-editable, so the role is NEVER read from it.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id, 'member',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  ) on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Block role/status changes by anyone who is not an admin.
-- (SQL Editor and the server secret key have no auth.uid(), so setup scripts still work.)
create or replace function public.guard_profile_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an administrator can change profiles';
  end if;
  return new;
end $$;
revoke execute on function public.guard_profile_changes() from public, anon, authenticated;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- 5. MEMBERSHIP PLANS (prices are set by the admin, never hardcoded)
create table public.membership_plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  model            text not null check (model in ('calendar','working_days')),
  default_fee      numeric(10,2) not null check (default_fee >= 0),
  duration_months  integer check (duration_months > 0),
  total_days       integer check (total_days > 0),
  description      text,
  is_public        boolean not null default false,
  is_active        boolean not null default true,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint plan_model_fields check (
    (model = 'calendar' and duration_months is not null)
    or (model = 'working_days' and total_days is not null)
  )
);
create trigger plans_updated_at before update on public.membership_plans
  for each row execute function public.set_updated_at();

-- 6. GYM SETTINGS (public contact info only. Never store secrets here.)
create table public.gym_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create trigger settings_updated_at before update on public.gym_settings
  for each row execute function public.set_updated_at();

insert into public.gym_settings (key, value) values
  ('contact', '{"address":"","phone":"","whatsapp":"","maps_url":"","hours":"","instagram":"","facebook":""}')
on conflict (key) do nothing;

-- 7. ROW LEVEL SECURITY
alter table public.profiles         enable row level security;
alter table public.membership_plans enable row level security;
alter table public.gym_settings     enable row level security;

-- profiles: you can read your own; admins read and change all. Nobody inserts or deletes through the API.
create policy "read own profile"   on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "admin updates profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- plans: the public sees only active public plans; admins manage everything
create policy "public reads plans" on public.membership_plans for select to anon, authenticated
  using ((is_public and is_active) or public.is_admin());
create policy "admin manages plans" on public.membership_plans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- settings: readable by everyone (public info only), writable by admins
create policy "public reads settings" on public.gym_settings for select to anon, authenticated using (true);
create policy "admin manages settings" on public.gym_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
