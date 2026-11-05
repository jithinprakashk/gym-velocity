-- OPTIONAL sample plans to see the Membership section. Prices are examples only.
-- Delete or edit them later; the admin will manage plans in Phase 2.
insert into public.membership_plans (name, model, default_fee, duration_months, total_days, is_public, display_order) values
  ('Monthly', 'calendar', 1500, 1, null, true, 1),
  ('30 Gym Days', 'working_days', 1500, null, 30, true, 2);
