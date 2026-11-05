# VELOCITY gym app: project context for Claude Code

The full requirements are in `MASTER_PROMPT.md` (the original brief; save it into this folder).
This file records decisions made AFTER that brief. Where they conflict, THIS FILE WINS.

## Process
- Present architecture, schema, auth design and plan first, then build phase by phase (Phases 1-5 in the brief), verifying each (typecheck, lint, build, DB tests) before moving on. Report only what was actually run.
- Use the real photos in `public/images/` only. Never substitute stock or AI images.
- The supplied photos are low resolution (about 510px tall). Use them as they are for now; the owner will supply originals. Do not upscale.

## Photos provided (all real, in public/images/)
- gym/interior-wide-lights.jpg: wide interior, lime turf, glowing ceiling lights (hero candidate)
- gym/interior-turf-lane.jpg: central turf lane, sled, dumbbells (hero candidate)
- gym/interior-reception.jpg: reception desk and open floor (about / gallery)
- equipment/plate-loaded-machines.jpg: plate-loaded machines, plates, large windows (facilities). Has a mural of a copyrighted anime character and a third-party machine brand: use in gallery/facilities, NOT as hero.
- facilities/exterior-night-entrance.jpg: night exterior with VELOCITY sign, walkway (about / contact)
- NOT yet provided: wheelchair ramp, parking, restrooms, logo. Use icon cards and a typographic VELOCITY wordmark until sent. Do not label any photo as the ramp until the owner confirms.

## Holiday and attendance rules (decided with owner)
1. Sundays are ALWAYS closed holidays. Built in; not stored in gym_holidays; admin cannot remove them.
2. Admin can add/edit/remove other holidays (date + title) in Settings and via a quick button on the attendance register. They show for everyone: public hours section, member dashboard/calendar, admin register ("Gym closed: <title>").
3. Attendance CANNOT be recorded on a Sunday or holiday, for ANY member (calendar-based included). Enforce inside mark_attendance / bulk_mark_attendance, not only in the UI.
4. Holidays never consume a day for 30-working-day memberships and are excluded from working-day counts in reports/utilisation.
5. Calendar memberships: holidays and Sundays never extend or shorten expiry.
6. Adding a holiday on a date that already has attendance: warn with the count; on confirm, reverse consumed days in one transaction, keep the records, write old/new values to audit_logs. Works for past dates too.
7. Removing a holiday reopens the date; nothing is created automatically.
8. Member workout diary may still be written on Sundays/holidays and never affects official attendance.

## Other agreed assumptions
- Calendar memberships show Expired by date, evaluated at read time.
- Excel (.xlsx) export is generated server-side alongside CSV.
- Payments can be recorded against past/expired memberships so balances survive renewal.
- INR with en-IN formatting; time zone Asia/Kolkata.
- All business logic in Postgres SECURITY DEFINER functions with is_admin() checks; RLS on every table; service-role key server-only, used only for admin account creation.
