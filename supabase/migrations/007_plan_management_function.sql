-- Use one audited, admin-only function for creating and editing membership plans.

create or replace function public.save_membership_plan(
  p_id uuid,
  p_name text,
  p_model text,
  p_default_fee numeric,
  p_duration_months integer,
  p_total_days integer,
  p_description text,
  p_display_order integer,
  p_is_public boolean,
  p_is_active boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_old jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Plan name is required'; end if;
  if p_model not in ('calendar', 'working_days') then raise exception 'Choose a valid membership model'; end if;
  if p_default_fee is null or p_default_fee < 0 then raise exception 'Fee cannot be negative'; end if;
  if p_display_order is null or p_display_order < 0 then raise exception 'Display order cannot be negative'; end if;
  if p_model = 'calendar' and coalesce(p_duration_months, 0) < 1 then raise exception 'Enter the duration in months'; end if;
  if p_model = 'working_days' and coalesce(p_total_days, 0) < 1 then raise exception 'Enter the number of gym days'; end if;

  if p_id is null then
    insert into public.membership_plans
      (name, model, default_fee, duration_months, total_days, description, display_order, is_public, is_active)
    values
      (trim(p_name), p_model, p_default_fee,
       case when p_model = 'calendar' then p_duration_months end,
       case when p_model = 'working_days' then p_total_days end,
       nullif(trim(p_description), ''), p_display_order, p_is_public, p_is_active)
    returning id into v_id;
    perform public.write_audit('plan.create', 'membership_plans', v_id, null,
      jsonb_build_object('name', trim(p_name), 'model', p_model, 'default_fee', p_default_fee,
        'duration_months', case when p_model = 'calendar' then p_duration_months end,
        'total_days', case when p_model = 'working_days' then p_total_days end,
        'description', nullif(trim(p_description), ''), 'display_order', p_display_order,
        'is_public', p_is_public, 'is_active', p_is_active));
  else
    select to_jsonb(m) into v_old from public.membership_plans m where id = p_id for update;
    if v_old is null then raise exception 'Plan not found'; end if;
    update public.membership_plans set
      name = trim(p_name), model = p_model, default_fee = p_default_fee,
      duration_months = case when p_model = 'calendar' then p_duration_months end,
      total_days = case when p_model = 'working_days' then p_total_days end,
      description = nullif(trim(p_description), ''), display_order = p_display_order,
      is_public = p_is_public, is_active = p_is_active
    where id = p_id
    returning id into v_id;
    perform public.write_audit('plan.update', 'membership_plans', v_id, v_old,
      jsonb_build_object('name', trim(p_name), 'model', p_model, 'default_fee', p_default_fee,
        'duration_months', case when p_model = 'calendar' then p_duration_months end,
        'total_days', case when p_model = 'working_days' then p_total_days end,
        'description', nullif(trim(p_description), ''), 'display_order', p_display_order,
        'is_public', p_is_public, 'is_active', p_is_active));
  end if;
  return v_id;
end $$;
grant execute on function public.save_membership_plan(uuid, text, text, numeric, integer, integer, text, integer, boolean, boolean) to authenticated;

create or replace function public.delete_membership_plan(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_memberships integer;
  v_requests integer;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select name into v_name from public.membership_plans where id = p_id for update;
  if v_name is null then raise exception 'Plan not found'; end if;
  select count(*) into v_memberships from public.memberships where plan_id = p_id;
  select count(*) into v_requests from public.member_registration_requests where requested_plan_id = p_id;
  if v_memberships > 0 or v_requests > 0 then
    raise exception 'This plan is used by existing memberships or registrations. Deactivate it instead of deleting it.';
  end if;
  delete from public.membership_plans where id = p_id;
  perform public.write_audit('plan.delete', 'membership_plans', p_id, jsonb_build_object('name', v_name), null);
end $$;
grant execute on function public.delete_membership_plan(uuid) to authenticated;
