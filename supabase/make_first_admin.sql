-- Run AFTER you create your login in Supabase: Authentication -> Users -> Add user
-- (tick "Auto Confirm User"). Replace the email below with yours.
update public.profiles
set role = 'admin', full_name = 'Gym Admin'
where id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');

-- Check it worked (should show role = admin):
select p.role, p.full_name, u.email
from public.profiles p join auth.users u on u.id = p.id;
