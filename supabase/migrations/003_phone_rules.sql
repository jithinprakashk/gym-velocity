-- VELOCITY: phone number rules. Optional but recommended. Run after 002.
-- Phone login itself needs no table change; this only protects the data.

-- STEP 1: run this alone first. It should return NO rows. If it lists numbers, fix them before step 2.
select phone, count(*) from public.profiles
where phone is not null group by phone having count(*) > 1;

-- STEP 2: no two people can share a number.
create unique index if not exists profiles_phone_key on public.profiles (phone) where phone is not null;

-- STEP 3: new or edited numbers must be exactly 10 digits.
-- NOT VALID = old rows are not rejected, but every new save is checked.
alter table public.profiles
  add constraint profiles_phone_10_digits check (phone is null or phone ~ '^[0-9]{10}$') not valid;
