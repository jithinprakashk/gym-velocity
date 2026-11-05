import { todayIST } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field, SelectField, StatusBadge } from "@/components/ui";
import { addHoliday, markAttendance, removeHoliday } from "./actions";

type Member = { id: string; member_code: string; status: string; profiles: { full_name: string; phone: string | null } | null };
type Attendance = { member_id: string; status: "present" | "absent" };
type Holiday = { id: string; holiday_date: string; title: string };

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : todayIST();
  const supabase = await createClient();
  const [{ data: members }, { data: attendance }, { data: holidays }] = await Promise.all([
    supabase.from("members").select("id, member_code, status, profiles(full_name, phone)").order("member_code"),
    supabase.from("official_attendance").select("member_id, status").eq("attendance_date", selectedDate),
    supabase.from("gym_holidays").select("id, holiday_date, title").order("holiday_date", { ascending: false }),
  ]);
  const byMember = new Map(((attendance ?? []) as Attendance[]).map((a) => [a.member_id, a.status]));

  return (
    <AdminPage title="Official attendance" current="/admin/attendance">
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <section>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Attendance date" name="date" type="date" defaultValue={selectedDate} required />
            <button className="btn btn-ghost" type="submit">Load date</button>
          </form>
          <div className="mt-6 grid gap-3">
            {(members as unknown as Member[] | null ?? []).filter((m) => m.status !== "inactive").map((member) => (
              <div key={member.id} className="rounded-xl border border-edge bg-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{member.profiles?.full_name || "(no name)"}</p>
                    <p className="text-sm text-mist">{member.member_code}{member.profiles?.phone ? ` · ${member.profiles.phone}` : ""}</p>
                  </div>
                  {byMember.has(member.id) && <StatusBadge status={byMember.get(member.id)!} />}
                </div>
                <ActionForm action={markAttendance} submitLabel="Save" className="mt-4 flex flex-wrap items-end gap-2" buttonClass="btn btn-primary !min-h-10">
                  <input type="hidden" name="member_id" value={member.id} />
                  <input type="hidden" name="attendance_date" value={selectedDate} />
                  <SelectField label="Mark as" name="status" options={[{ value: "present", label: "Present" }, { value: "absent", label: "Absent" }]} defaultValue={byMember.get(member.id) ?? "present"} />
                </ActionForm>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-8">
          <section className="rounded-xl border border-edge bg-panel p-5">
            <h2 className="text-2xl">Add holiday</h2>
            <p className="mt-2 text-sm text-mist">Sundays are built-in holidays. If attendance exists on this date, confirm to preserve records and reverse working-day consumption.</p>
            <ActionForm action={addHoliday} submitLabel="Save holiday" className="mt-5 space-y-4">
              <Field label="Date" name="holiday_date" type="date" required />
              <Field label="Title" name="title" placeholder="Diwali" required />
              <label className="flex gap-2 text-sm text-mist"><input type="checkbox" name="confirm_attendance" /> Confirm attendance adjustment if needed</label>
            </ActionForm>
          </section>
          <section>
            <h2 className="text-2xl">Upcoming holidays</h2>
            <ul className="mt-4 space-y-2">
              {(holidays as Holiday[] | null ?? []).map((holiday) => (
                <li key={holiday.id} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-panel p-3 text-sm">
                  <span><strong>{holiday.title}</strong><br /><span className="text-mist">{holiday.holiday_date}</span></span>
                  <ActionForm action={removeHoliday} submitLabel="Remove" confirm="Remove this holiday and reopen the date?" className="m-0" buttonClass="btn btn-ghost !min-h-9 !px-3 !text-xs">
                    <input type="hidden" name="id" value={holiday.id} />
                  </ActionForm>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AdminPage>
  );
}
