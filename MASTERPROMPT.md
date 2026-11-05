# MASTER PROJECT PROMPT: VELOCITY – COMPLETE GYM WEBSITE & MANAGEMENT SYSTEM

Act as a senior full-stack software architect, UI/UX designer, database architect and software engineer.

I want you to build a complete, functional web application for **VELOCITY**, a unisex gym.

This is not just a marketing website. It must be a complete gym management system with three major components:

1. Public-facing gym website.
2. Member portal with personal workout tracking and membership information.
3. Admin portal for managing members, official attendance, memberships, payments and reports.

The application must use **Supabase as its backend platform, PostgreSQL as its relational SQL database, and Supabase Auth for authentication**.

Do not create just a visual prototype. All major features must be functional, connected to the database and tested.

---

# 1. TECHNOLOGY STACK

Use the following technologies:

| Component | Technology |
|---|---|
| Frontend | Next.js with App Router |
| Programming language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Icons | Lucide React |
| Backend | Supabase |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Database security | Supabase Row Level Security |
| Hosting | Netlify or another suitable free-tier host |
| Source control | GitHub |

### Supabase is mandatory

Use Supabase for:

- PostgreSQL database.
- User authentication.
- Secure member and administrator accounts.
- Database access and queries.
- Row Level Security.
- Database functions and triggers where appropriate.
- Storage for gym photographs and other uploaded assets, if needed.

Do not substitute Supabase with Firebase, MongoDB, localStorage or another backend.

The application should use the official Supabase JavaScript/SSR integration appropriate for Next.js.

Use environment variables for Supabase URL and keys.

Never expose the Supabase service-role key in frontend code.

---

# 2. BRANDING AND DESIGN

Brand name: VELOCITY

Business: Unisex Gym.

Design direction:

- Modern premium fitness aesthetic.
- Dark charcoal and black background.
- Lime green accent colour.
- White and light-grey typography.
- Bold headings.
- Professional fitness imagery.
- Clean layouts.
- Subtle animations.
- Modern dashboard cards.

Suggested tagline:

"BUILD STRENGTH. OWN YOUR PACE."

The design must look professional, modern and premium.

Avoid generic website templates.

## Mobile-first and responsive design

The complete application must be mobile-friendly.

Support:

- Desktop.
- Laptop.
- Tablet.
- Android smartphones.
- iPhones.

Mobile requirements:

- Responsive hamburger navigation.
- Easy-to-use mobile forms.
- No horizontal scrolling.
- Mobile-friendly attendance calendar.
- Compact member cards instead of wide tables where necessary.
- Responsive dashboard statistics.
- Touch-friendly buttons.
- Properly sized text.
- Member dashboard mobile navigation.
- Admin attendance marking through smartphones.

Do not simply shrink the desktop design. Build a proper mobile experience.

---

# 3. GYM PHOTOGRAPHS AND BRAND ASSETS – PROVIDED BY CLIENT

I will provide the actual photographs of Velocity gym.

These may include:

- Exterior and entrance.
- Interior gym photographs.
- Upper-body workout equipment.
- Lower-body workout equipment.
- Individual machines.
- Dumbbells and free weights.
- Parking area.
- Wheelchair ramp and entrance.
- Other gym facilities.
- Logo, if available.

IMPORTANT:

1. Use the actual photographs I provide as the primary images throughout the website.
2. Do not replace actual gym photographs with AI-generated images or unrelated stock gym photographs.
3. Do not invent or visually misrepresent gym equipment or facilities.
4. Do not assume equipment shown in reference images is available at Velocity.
5. Until I provide the photographs, create attractive image placeholders with the correct dimensions and layouts.
6. Organize photographs into an easy-to-maintain assets folder.
7. Allow the administrator to update gallery photographs without changing application code, if practical.
8. Optimize photographs for web performance without significantly reducing quality.
9. Support responsive image rendering.
10. If the logo is not provided initially, use a clean typographic VELOCITY logo as a temporary placeholder.

Create an appropriate folder structure, for example:

- public/images/gym/
- public/images/equipment/
- public/images/facilities/
- public/images/gallery/
- public/images/branding/

Build the website around the actual gym and its facilities, not a generic fitness centre template.

---

# 4. PUBLIC WEBSITE

Create a professional homepage.

## Header

Include:

- Velocity logo.
- Home.
- About Us.
- Facilities.
- Membership.
- Gallery.
- Contact.
- Member Login.

## Hero section

Headline:

"BUILD STRENGTH. OWN YOUR PACE."

Supporting text:

"Your fitness journey starts here. Train better, feel stronger and achieve your goals at Velocity."

Include:

- Join Now.
- Explore Facilities.
- Actual gym photograph as the background or primary visual.

## About Velocity

Describe Velocity as a modern unisex gym with equipment for upper-body and lower-body workouts.

## Equipment and facilities

Showcase:

- Upper-body equipment.
- Lower-body equipment.
- Strength-training machines.
- Free weights and dumbbells.
- Other available equipment.

Use actual gym photographs provided by me.

## Accessibility and convenience

This is an important differentiator and must be prominently displayed.

Velocity offers:

- Ground-floor gym facility.
- Wheelchair-accessible ramp.
- Ample parking.
- Convenient location near the main road.
- Separate male and female restrooms.

Highlight accessibility as a core feature, not an afterthought.

Do not claim that restrooms are wheelchair accessible unless confirmed.

## Membership section

Display membership options.

All membership pricing must be configurable by the administrator.

Do not hardcode membership prices.

Include a Join Now or Contact Us CTA.

## Gallery

Create a professional responsive image gallery using the photographs I provide.

## Contact

Provide configurable fields for:

- Gym address.
- Phone number.
- WhatsApp number.
- Google Maps link.
- Business hours.
- Social media links.

Use placeholders until actual information is provided.

---

# 5. AUTHENTICATION AND USER ROLES

Implement authentication through Supabase Auth.

Two roles:

1. ADMIN.
2. MEMBER.

## Admin

Admin can:

- Access the admin portal.
- Create and manage members.
- Configure memberships.
- Record payments.
- Manage official attendance.
- View reports.
- Configure gym settings.

## Member

Members can:

- Access their own dashboard.
- View their own membership details.
- View payment history.
- View outstanding payment.
- View membership days used and remaining.
- Maintain their personal workout diary.
- View their own attendance history.

Members must never access another member's private information.

Implement:

- Server-side authentication checks.
- Role-based access control.
- Protected routes.
- Supabase Row Level Security policies.

Do not rely only on hiding UI elements.

Only administrators can create member accounts and assign roles.

Members must never be able to register themselves as administrators.

Provide secure password setup and password reset functionality.

---

# 6. MEMBER DASHBOARD

After login, display a personalized dashboard.

## Membership summary

Display:

- Member name.
- Member ID.
- Membership type.
- Membership start date.
- Membership expiry date, where applicable.
- Membership status.
- Total membership days.
- Membership days used.
- Membership days remaining.
- Total official gym attendance.
- Total amount payable.
- Total amount paid.
- Outstanding/pending amount.
- Last payment date.
- Next payment due date.

Make pending payments and remaining membership days prominent.

Use visual indicators for:

- Active membership.
- Expiring membership.
- Expired membership.
- Pending payments.

## Important distinction

There are TWO separate attendance concepts:

1. Official gym attendance, recorded by the administrator.
2. Personal workout diary, recorded by the member.

The member's personal workout diary must never automatically modify official gym attendance or membership consumption.

Only admin-verified attendance can consume days from a 30-working-day membership.

---

# 7. MEMBER PERSONAL WORKOUT DIARY

Create a calendar-based personal activity tracker.

Members can select any date and record their activity.

Activity categories:

- Upper Body Workout.
- Lower Body Workout.
- Full Body Workout.
- Cardio.
- Custom Workout.
- Rest Day.
- Missed / Did Not Attend.

Members can:

- Select a date.
- Select an activity.
- Add exercise details.
- Add notes.
- Record sets.
- Record repetitions.
- Record weights.
- Edit their own diary entries.
- View previous workout records.
- View monthly summaries.

Calendar colours:

- Upper Body: Blue.
- Lower Body: Green.
- Full Body: Teal.
- Cardio: Orange.
- Rest Day: Purple.
- Missed: Red.

Monthly summary:

- Workout days.
- Rest days.
- Missed days.
- Total activities.

Members must only see and modify their own diary.

Members cannot modify official admin attendance.

---

# 8. ADMIN DASHBOARD

Create a dedicated administrator portal.

Dashboard statistics:

- Total members.
- Active members.
- Inactive members.
- Expired memberships.
- Today's attendance.
- Pending payments.
- Monthly collections.
- Memberships expiring soon.

Admin navigation:

1. Dashboard.
2. Member Management.
3. Official Attendance.
4. Membership Management.
5. Payments.
6. Exercise Library.
7. Reports.
8. Gallery Management.
9. Settings.

---

# 9. MEMBER MANAGEMENT

Admin must be able to:

- Create member accounts.
- Assign unique member IDs.
- Enter name.
- Enter mobile number.
- Enter email.
- Enter address.
- Add joining date.
- Assign membership type.
- Configure membership fee.
- Configure membership duration.
- Activate accounts.
- Deactivate accounts.
- Reactivate accounts.
- Edit member details.
- View membership history.
- View payment history.
- View official attendance history.
- View workout diary where appropriate for administration.

Member statuses:

- Active.
- Inactive.
- Suspended.
- Expired.

Deactivating an account must not delete historical records.

---

# 10. MEMBERSHIP MANAGEMENT – TWO BILLING MODELS

This is a critical business requirement.

The administrator must choose the membership model individually for each member.

## MODEL A: CALENDAR-BASED MONTHLY MEMBERSHIP

Example:

- Fee: ₹1,500.
- Start date: 1 November 2026.
- Expiry date: 30 November 2026.

Rules:

- Valid for the configured calendar period.
- Attendance does not determine expiry.
- Rest days do not extend membership.
- Missed days do not extend membership.
- Admin can configure the billing period and fee.
- Support monthly and other configurable calendar-based durations.

## MODEL B: 30-WORKING-DAY MEMBERSHIP

Example:

- Fee: ₹1,500.
- Total days: 30.
- Each official verified attendance consumes one day.

Rules:

- Only admin-verified attendance consumes a membership day.
- Absent days do not consume a day.
- Member-selected rest days do not consume a day.
- Sundays do not consume a day.
- Gym holidays do not consume a day.
- Member diary entries do not consume a day.
- Membership expires after all 30 attendance days are consumed.

Example:

Total membership days: 30
Verified attendance: 12
Days used: 12
Days remaining: 18

Calculate these values dynamically from official attendance records.

## ADMINISTRATOR FLEXIBILITY

Admin must be able to independently configure:

- Membership model.
- Membership fee.
- Membership start date.
- Calendar expiry date.
- Total working days.
- Discount.
- Additional charges.
- Amount payable.
- Payment received.
- Outstanding balance.
- Membership status.

Do not force all members to have identical membership pricing.

## MEMBERSHIP RENEWAL

- Admin can renew existing memberships.
- Admin can renew expired memberships.
- Admin can create a new membership record.
- Previous membership history must be retained.
- Payment history must be retained.
- Never overwrite historical memberships.

---

# 11. ADMIN OFFICIAL ATTENDANCE TRACKER

This is a completely separate system from the member workout diary.

Create a dedicated attendance register for the administrator.

This is the authoritative gym attendance record.

Admin must be able to:

- Select a date.
- View all active members.
- Search members by name or member ID.
- Mark Present.
- Mark Absent.
- Correct attendance.
- View previously recorded attendance.
- Filter by membership status.
- Filter by payment status.
- View daily attendance.
- View historical attendance.
- Export attendance reports.

Example:

| Member | Membership | Attendance |
|---|---|---|
| Member A | 30 working days | Present |
| Member B | Monthly | Present |
| Member C | Monthly | Absent |

Include individual and bulk attendance marking.

## CRITICAL BUSINESS LOGIC

When admin marks PRESENT:

- Create official attendance.
- If membership is 30-working-day based, consume exactly one day.
- If membership is calendar-based, do not change expiry.

When admin marks ABSENT:

- Do not consume a membership day.

Prevent duplicate attendance for the same member on the same date.

If admin changes Present to Absent:

- Reverse the membership consumption.
- Preserve the original record in the audit log.

Attendance changes must be transactional and auditable.

A member must never be able to alter this register.

---

# 12. PAYMENT MANAGEMENT

Create a dedicated payment module.

Admin must be able to:

- Record cash payments.
- Record UPI payments.
- Record bank transfers.
- Record other payment methods.
- Enter amount.
- Enter payment date.
- Add transaction reference.
- Add remarks.
- View payment history.
- Correct or reverse incorrect payments with audit history.

Calculate:

Outstanding amount = Total amount payable - Total valid payments received.

Display payment information to both admin and member.

Member can view:

- Membership fee.
- Amount paid.
- Outstanding balance.
- Payment dates.
- Payment methods.
- Payment history.

Admin can filter members by pending payments.

Do not integrate an online payment gateway in the initial version.

Use INR throughout.

---

# 13. REPORTING

Provide reports for:

- Daily attendance.
- Monthly attendance.
- Member-wise attendance.
- Attendance by membership model.
- Monthly collections.
- Pending payments.
- Expired memberships.
- Upcoming renewals.
- Active and inactive members.
- Membership utilisation.

Provide CSV/Excel export functionality.

---

# 14. SUPABASE DATABASE ARCHITECTURE

Use Supabase PostgreSQL as the single source of truth.

Create a normalized relational database.

Suggested tables:

1. profiles
2. members
3. membership_plans
4. memberships
5. payments
6. official_attendance
7. workout_diary
8. exercises
9. workout_exercises
10. gym_holidays
11. audit_logs
12. gym_settings

Use:

- UUID primary keys.
- Foreign key relationships.
- Appropriate indexes.
- Created and updated timestamps.
- Constraints.
- Database functions where needed.

## Data integrity

- One official attendance record per member per date.
- A payment must belong to a valid member and membership.
- Workout diary records must belong to the logged-in member.
- Preserve historical records.
- Attendance corrections must be auditable.
- Membership days used cannot be negative or exceed the total.
- Financial calculations must use valid payments.
- Use database transactions for attendance and membership updates.

## Supabase security

Implement comprehensive Row Level Security.

Members can:

- Read their own profile.
- Read their own memberships.
- Read their own payments.
- Read their own official attendance.
- Create and update their own workout diary.

Members cannot:

- Create or edit official attendance.
- Modify payments.
- Change membership fees.
- Change membership duration.
- Access other members' records.
- Change roles.

Admins can manage all gym records.

Verify roles on the server.

Never trust a client-supplied member ID or role.

Provide complete SQL scripts for:

- Initial schema.
- RLS policies.
- Database functions.
- Triggers.
- Indexes.
- Migrations.
- Optional test data.

---

# 15. USER EXPERIENCE

The application should be simple enough for non-technical gym staff.

Include:

- Simple navigation.
- Clear labels.
- Minimal clicks.
- Confirmation dialogs.
- Loading indicators.
- Success/error notifications.
- Form validation.
- Search and filters.
- Empty-state messages.
- Accessible controls.

The admin must be able to mark attendance quickly from a mobile phone.

---

# 16. ACCESSIBILITY

Follow WCAG 2.2 AA principles where practical.

- Good colour contrast.
- Keyboard navigation.
- Screen-reader-friendly labels.
- Visible focus indicators.
- Proper form validation.
- Touch-friendly controls.
- Do not use colour alone to convey status.

Public website must accurately highlight the ground-floor facility, wheelchair ramp, parking and facilities.

---

# 17. GYM SETTINGS

Provide an administrator settings section.

Configurable settings:

- Gym name.
- Logo.
- Address.
- Contact number.
- WhatsApp number.
- Business hours.
- Holidays.
- Currency.
- Time zone: Asia/Kolkata.
- Membership display options.
- Exercise categories.
- Gallery photographs.

Use Indian Rupee formatting, e.g. ₹1,500.

---

# 18. TESTING REQUIREMENTS

Write tests for:

1. Calendar membership expiry.
2. 30-working-day membership consumption.
3. Rest days not consuming membership days.
4. Absent days not consuming membership days.
5. Sundays and holidays not consuming membership days.
6. Attendance correction reversing consumption.
7. Duplicate attendance prevention.
8. Partial payments and outstanding balances.
9. Member access restrictions.
10. Admin access permissions.
11. Member diary not changing official attendance.
12. Account deactivation preserving historical data.

Test mobile responsiveness.

Run:

- TypeScript checks.
- Lint.
- Production build.
- Database integration tests.
- Authentication and authorization tests.

Fix all significant errors before considering the project complete.

---

# 19. DEPLOYMENT AND DOCUMENTATION

The project must be suitable for free-tier trial deployment.

Use:

- Supabase Free for backend, database and authentication.
- Netlify Free or another compatible free-tier hosting service for the frontend.
- GitHub for source control.

Create:

- README.md.
- SETUP.md.
- .env.example.
- Complete Supabase SQL setup scripts.
- Deployment instructions.
- Admin account creation instructions.
- Member account creation instructions.
- Database migration instructions.
- Testing instructions.

Do not commit secrets to GitHub.

Explain all required environment variables.

Clearly document Supabase free-tier limitations and hosting requirements.

---

# 20. DEVELOPMENT APPROACH

Work in phases.

PHASE 1:
- Inspect existing project.
- Set up Next.js.
- Configure Supabase.
- Implement responsive public homepage.
- Implement authentication.
- Implement role-based routing.

PHASE 2:
- Admin dashboard.
- Member management.
- Membership models.
- Payment management.

PHASE 3:
- Official admin attendance.
- Separate member workout diary.
- Membership-day calculation engine.

PHASE 4:
- Exercise library.
- Reports.
- Gallery management.
- Exports.

PHASE 5:
- Security testing.
- Mobile responsiveness testing.
- Database testing.
- Production build.
- Deployment documentation.

## IMPORTANT DEVELOPMENT INSTRUCTIONS

- Do not stop after creating the frontend.
- Do not create only static pages.
- Do not use localStorage as the permanent database.
- Do not implement fake authentication.
- Do not expose service-role keys.
- Do not allow members to change official attendance.
- Do not calculate membership consumption from the member's workout diary.
- Keep admin and member portals separate.
- Use Supabase for all persistent application data.
- Do not hardcode membership pricing.
- Do not use unrelated stock or AI-generated gym photographs in place of the photographs I will provide.
- Make the entire application mobile-friendly.
- Do not leave important features as TODOs.

Start by inspecting the existing project directory and its files.

If an existing starter project is available, inspect it and reuse useful components rather than unnecessarily replacing everything.

Before coding, present:
1. Proposed application architecture.
2. Database schema and relationships.
3. Authentication and role design.
4. Implementation plan.

Then implement each phase, verifying it before proceeding.

At completion, provide:
- Features actually implemented.
- Features tested.
- Build and lint results.
- Supabase configuration still required.
- Deployment instructions.
- Any outstanding issues.

The final deliverable must be a complete, working and mobile-friendly gym management application for VELOCITY, ready for real-world testing.