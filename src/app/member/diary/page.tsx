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

type Entry = { id: string; activity_date: string; category: keyof typeof categoryLabels; title: string | null; exercise_details: string | null; sets: number | null; repetitions: number | null; weight_kg: number | null; notes: string | null };

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
  const [{ data: entries }, { data: attendance }, { data: holidays }] = memberId
    ? await Promise.all([
      supabase.from("workout_diary").select("id, activity_date, category, title, exercise_details, sets, repetitions, weight_kg, notes").eq("member_id", memberId).gte("activity_date", from).lte("activity_date", to).order("activity_date", { ascending: false }),
      supabase.from("official_attendance").select("attendance_date, status").eq("member_id", memberId).gte("attendance_date", from).lte("attendance_date", to),
      supabase.from("gym_holidays").select("holiday_date, title").gte("holiday_date", from).lte("holiday_date", to),
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
        <WorkoutCalendar month={month} entries={entries ?? []} attendance={attendance ?? []} holidays={holidays ?? []} />
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-xl border border-edge bg-panel p-5">
          <h2 className="text-2xl">Record activity</h2>
          <p className="mt-2 text-sm text-mist">This personal diary never changes official attendance or membership days.</p>
          <ActionForm action={saveDiary} submitLabel="Save entry" className="mt-5 space-y-4">
            <Field label="Date" name="activity_date" type="date" defaultValue={todayIST()} required />
            <SelectField label="Activity" name="category" required options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
            <Field label="Title" name="title" placeholder="Leg day" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Sets" name="sets" type="number" min={1} />
              <Field label="Reps" name="repetitions" type="number" min={1} />
              <Field label="Weight (kg)" name="weight_kg" type="number" min={0} step="0.01" />
            </div>
            <div><label htmlFor="exercise_details" className="mb-1.5 block text-sm font-medium">Exercise details</label><textarea id="exercise_details" name="exercise_details" rows={3} className="field" placeholder="Squats, lunges..." /></div>
            <div><label htmlFor="notes" className="mb-1.5 block text-sm font-medium">Notes</label><textarea id="notes" name="notes" rows={3} className="field" /></div>
          </ActionForm>
        </section>
        <section>
          <h2 className="text-2xl">Recent entries</h2>
          {(!entries || entries.length === 0) ? <p className="mt-4 text-mist">No diary entries yet.</p> : (
            <ul className="mt-4 grid gap-3">
              {(entries as Entry[]).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-edge bg-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold">{entry.title || categoryLabels[entry.category]}</p><p className="text-sm text-mist">{entry.activity_date} · {categoryLabels[entry.category]}</p></div>
                    <ActionForm action={deleteDiary} submitLabel="Delete" confirm="Delete this diary entry?" className="m-0" buttonClass="btn btn-ghost !min-h-9 !px-3 !text-xs"><input type="hidden" name="id" value={entry.id} /></ActionForm>
                  </div>
                  {entry.exercise_details && <p className="mt-3 whitespace-pre-wrap text-sm">{entry.exercise_details}</p>}
                  {(entry.sets || entry.repetitions || entry.weight_kg != null) && <p className="mt-2 text-sm text-mist">{[entry.sets && `${entry.sets} sets`, entry.repetitions && `${entry.repetitions} reps`, entry.weight_kg != null && `${entry.weight_kg} kg`].filter(Boolean).join(" · ")}</p>}
                  {entry.notes && <p className="mt-2 text-sm text-mist">{entry.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
