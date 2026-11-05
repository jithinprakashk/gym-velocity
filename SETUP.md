# VELOCITY: Phase 1 setup

Cost: ₹0. You need Node.js (LTS) and VS Code.

## 1. Open the project
1. Unzip the folder, then in VS Code: File -> Open Folder -> choose `velocity`.
2. Open the terminal: Terminal -> New Terminal.
3. Run: `npm install`   (takes a few minutes; needs internet)

## 2. Create the Supabase project
1. supabase.com -> New project. Name: velocity. Pick a region near India. Save the database password.
2. Authentication -> Sign In / Providers: enable **Email** sign-in with password and enable **Allow new users to sign up**. Phone authentication is not required. Member self-registration is enabled; new members can sign in with email immediately but remain pending until an admin approves them.
3. Find your keys: click **Connect** at the top of the project (or Project Settings -> Data API for the URL, and -> API Keys for the keys).

## 3. Add your keys
1. In VS Code, copy `.env.example` to a new file named `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the key starting `sb_publishable_`
   - `SUPABASE_SECRET_KEY` = the key starting `sb_secret_` (not used until Phase 2; keep it private)
3. Never share `.env.local` or upload it to GitHub (it is already in `.gitignore`).

## 4. Create the database
1. Supabase -> SQL Editor -> New query.
2. Open `supabase/migrations/001_phase1_core.sql` in VS Code, copy everything, paste, click **Run**. Expect "Success".
3. Optional: run `supabase/optional_test_plans.sql` the same way to see sample plans on the site.

## 5. Create your admin login
1. Supabase -> Authentication -> Users -> Add user -> Create new user. Enter your email and a strong password. Tick **Auto Confirm User**.
2. SQL Editor: open `supabase/make_first_admin.sql`, put your email in, and Run. The result table should show role = admin.

## 6. Redirect addresses (for password reset emails)
Authentication -> URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/auth/callback`
(When you deploy, add your live address too and update `NEXT_PUBLIC_SITE_URL`.)

## 7. Run it
`npm run dev`, then open http://localhost:3000

## 8. Check everything (tick each)
- [ ] Homepage loads, shows your photos, hamburger menu works on a narrow window.
- [ ] Member Login -> admin email -> lands on **Admin dashboard**.
- [ ] While signed in as admin, visit /member/dashboard: you are sent back to the admin dashboard.
- [ ] Sign out, then visit /admin/dashboard: you are sent to Sign in.
- [ ] Forgot password: email arrives, link opens "Choose a password", new password works.
- [ ] Supabase -> Table Editor -> profiles: your row says role = admin.

## 9. Quality checks (run in the terminal)
`npm run typecheck`, `npm run lint`, `npm run build`
If any print errors, copy the red text to Claude and ask for a fix.

## Notes
- Password-reset emails use Supabase's built-in sender, which is rate-limited on the free plan. Fine for testing.
- Supabase Free projects pause after a week with no activity (see earlier discussion). Restore from the dashboard if that happens.


---
# Phase 2 additions (members, memberships, payments)

1. Run `npm install` again (new packages: zod, server-only).
2. In `.env.local`, make sure `SUPABASE_SECRET_KEY` is filled in now. It is required to create member logins. It is used only on the server.
3. Supabase -> SQL Editor -> run `supabase/migrations/002_phase2_members_payments.sql` (after 001).
4. Optional: if you have not added plans, run `supabase/optional_test_plans.sql`, or add plans at Admin -> Membership Management.
5. `npm run dev`, sign in as admin.

## Phase 2 checks
- [ ] Membership Management: create a plan, tick "Show on the public website", see it on the homepage.
- [ ] Members -> Add member: fill the form. A temporary password is shown ONCE. Copy it.
- [ ] Sign in as that member in a private window: you reach the member dashboard, not the admin pages.
- [ ] Member page: record a partial payment. Outstanding falls. Try paying more than is due: it is refused.
- [ ] Reverse a payment with a reason: it stays in history, struck through, outstanding rises again.
- [ ] Add a renewal: old membership is kept as Closed. Dashboard numbers change.
- [ ] Mark a member inactive: that member can no longer sign in. Mark active again: works. Records stay.
- [ ] Supabase -> Table Editor -> audit_logs: entries exist for each action above.

---
# Phase 3 additions (attendance, holidays and workout diary)

1. In Supabase SQL Editor, run `supabase/migrations/004_phase3_attendance_diary.sql` after the Phase 2 migration.
2. Sign in as an admin and open **Settings** to save the gym address, phone, WhatsApp, Google Maps link and business hours. These values appear in the homepage Contact section.
3. Open **Official Attendance** to select a date and mark members present or absent. Sundays are always closed. Add other holidays there; attendance is blocked on those dates too.
4. A 30-working-day membership counts only admin-marked Present records. Calendar memberships are not extended by absences or holidays.
5. Members can open **Workout Diary** and record any date, including Sundays and holidays. Diary entries never change official attendance or membership days.

## Phase 3 checks
- [ ] Admin -> Settings -> save contact details -> homepage shows them under Visit Velocity.
- [ ] Admin -> Official Attendance -> mark Present and Absent; duplicate saves update the same record.
- [ ] Sunday and holiday attendance is rejected by the database function.
- [ ] Add a holiday on a date with attendance: without confirmation it warns; with confirmation it preserves records.
- [ ] Member -> Workout Diary -> save and delete an entry; official attendance is unchanged.

---
# Phase 5 additions (member registration and payment approval)

1. Run `supabase/migrations/005_member_registration_payment_claims.sql` after the Phase 3 migration.
2. Publish at least one active membership plan. Members choose one during registration.
3. Members open `/register`, create an account with their phone number and password, and can sign in immediately with a pending-approval dashboard.
4. Admin -> **Approvals** -> choose the plan and fee, then approve the registration. This creates the member and membership without exposing admin privileges.
5. Members can submit payment amount, date, method and reference from their dashboard. The claim does not reduce the balance until an admin approves it under **Approvals**.

## Phase 5 checks
- [ ] A member can register with a phone number and password.
- [ ] The member can sign in while their registration is pending.
- [ ] Admin approval creates the member record and selected membership.
- [ ] A member payment claim remains pending until approved.
- [ ] Approving a payment claim adds it to the payment history and reduces outstanding balance.

---
# Payment-date anchoring

Run `supabase/migrations/006_payment_date_anchoring.sql` after migration 005. The earliest approved payment date becomes the effective start date for both membership models. Calendar plans calculate their expiry and calendar days remaining from that date; working-day plans count verified attendance from that date. A payment entered after the configured membership start date is marked as delayed and shown with a warning while entering the date.

Run `supabase/migrations/007_plan_management_function.sql` after migration 006. This enables reliable, audited creation, editing and safe deletion of membership plans through the admin portal. Plans already used by memberships or pending registrations cannot be deleted; deactivate them instead.

## Logo font
Put your licensed Undergrad font file in `public/fonts/` as `Undergrad.woff2` (or .otf/.ttf). Until then a similar free font (Graduate) is used.


---
# Email login

1. Supabase -> Authentication -> Sign In / Providers -> enable **Email** and **Allow new users to sign up**. Phone authentication is not required.
2. Re-run `npm install` is NOT needed. Just restart `npm run dev`.
3. New members must provide an email for login and a 10-digit mobile number as their primary contact.
4. Accounts created previously with phone-only authentication need an email assigned by an administrator before they can use email login.
5. If a member forgets their password: open their page -> Sign-in password -> Create new password.

New checks:
- [ ] Register with an email and mobile number, then sign in with the email and password.
- [ ] Add a member with an email and mobile number; the temporary password is shown with the email login.
- [ ] Change the member's mobile number; the email login remains unchanged.
- [ ] Member page -> Create new password -> the old password stops working.

## Optional: phone rules
Supabase -> SQL Editor -> run `supabase/migrations/003_phone_rules.sql`. Run the first query alone and check it returns no rows, then run the rest. After this, the database itself refuses duplicate or malformed numbers.
