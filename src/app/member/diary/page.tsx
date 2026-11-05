import { ActionForm } from "@/components/action-form";
import { Field, SelectField } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/format";
import { deleteDiary, saveDiary } from "./actions";
import { WorkoutCalendar } from "./calendar";

const categoryLabels = {
  upper_body: "Upper body", lower_body: "Lower body", full_body: "Full body",
  cardio: "Cardio", custom: "Custom workout", rest_day: "Rest day", missed: "Missed / did not attend",
};

type Entry = { id: string; activity_date: string; category: keyof typeof categoryLabels; exercise_details: string | null };

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const profile = await requireRole("member");
  const supabase = await createClient();
  const params = await searchParams;
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()).slice(0, 7);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "") ? params.month! : currentMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  const { data: memberId } = await supabase.rpc("my_member_id");
  const [{ data: entries }, { data: holidays }, { data: library }] = memberId
    ? await Promise.all([
      supabase.from("workout_diary").select("id, activity_date, category, exercise_details").eq("member_id", memberId).gte("activity_date", from).lte("activity_date", to).order("activity_date", { ascending: false }),
      supabase.from("gym_holidays").select("holiday_date, title").gte("holiday_date", from).lte("holiday_date", to),
      supabase.from("exercise_library").select("id, name, exercise_type, category").order("name"),
    ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <PortalShell title="Workout diary" name={profile.full_name || profile.email} roleLabel="Member" current="/member/diary" nav={[
      { label: "Dashboard", href: "/member/dashboard", ready: true },
      { label: "Workout Diary", href: "/member/diary", ready: true },
      { label: "Payments", ready: false },
      { label: "Attendance", ready: false },
    ]}>
      <div className="grid gap-8">
        <WorkoutCalendar month={month} entries={entries ?? []} holidays={holidays ?? []} />
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-xl border border-edge bg-panel p-5">
          <h2 className="text-2xl">Record activity</h2>
          <p className="mt-2 text-sm text-mist">Workout entries count as attended, missed entries count as missed, and rest days are not attendance.</p>
          <ActionForm action={saveDiary} submitLabel="Save entry" className="mt-5 space-y-4">
            <Field label="Date" name="activity_date" type="date" defaultValue={todayIST()} required />
            <SelectField label="Exercise library option" name="library_id" options={[{ value: "", label: "Choose an option (optional)" }, ...((library ?? []) as { id: string; name: string; exercise_type: string }[]).map((item) => ({ value: item.id, label: `${item.name} · ${item.exercise_type}` }))]} />
            <SelectField label="Activity" name="category" required options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
            <div><label htmlFor="exercise_details" className="mb-1.5 block text-sm font-medium">Exercise details</label><textarea id="exercise_details" name="exercise_details" rows={3} className="field" placeholder="Squats, lunges..." /></div>
          </ActionForm>
        </section>
        <section>
          <h2 className="text-2xl">Recent entries</h2>
          {(!entries || entries.length === 0) ? <p className="mt-4 text-mist">No diary entries yet.</p> : (
            <ul className="mt-4 grid gap-3">
              {(entries as Entry[]).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-edge bg-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold">{categoryLabels[entry.category]}</p><p className="text-sm text-mist">{entry.activity_date}</p></div>
                    <ActionForm action={deleteDiary} submitLabel="Delete" confirm="Delete this diary entry?" className="m-0" buttonClass="btn btn-ghost !min-h-9 !px-3 !text-xs"><input type="hidden" name="id" value={entry.id} /></ActionForm>
                  </div>
                  {entry.exercise_details && <p className="mt-3 whitespace-pre-wrap text-sm">{entry.exercise_details}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
