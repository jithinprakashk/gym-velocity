"use client";

type AttendancePoint = { label: string; present: number; absent: number };
type WorkoutPoint = { label: string; count: number };

function Donut({ present, absent }: { present: number; absent: number }) {
  const total = present + absent;
  const presentShare = total ? (present / total) * 100 : 0;
  return (
    <div className="relative size-44 shrink-0 rounded-full" style={{ background: `conic-gradient(#c8f135 0 ${presentShare}%, #f87171 ${presentShare}% 100%)` }}>
      <div className="absolute inset-5 grid place-items-center rounded-full bg-panel text-center">
        <strong className="text-3xl">{total ? `${Math.round(presentShare)}%` : "—"}</strong>
        <span className="text-xs text-mist">attendance</span>
      </div>
    </div>
  );
}

export function MemberCharts({
  attendance, workouts, paid, outstanding,
}: {
  attendance: AttendancePoint[]; workouts: WorkoutPoint[]; paid: number; outstanding: number;
}) {
  const present = attendance.reduce((sum, item) => sum + item.present, 0);
  const absent = attendance.reduce((sum, item) => sum + item.absent, 0);
  const maxWorkout = Math.max(...workouts.map((item) => item.count), 1);
  const totalDue = paid + outstanding;
  const paidShare = totalDue ? Math.min((paid / totalDue) * 100, 100) : 0;

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-3xl">Your progress</h2>
        <p className="mt-1 text-sm text-mist">A quick view of your consistency, workouts, and payment progress.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_1fr]">
        <article className="rounded-xl border border-edge bg-panel p-5">
          <h3 className="text-xl">Attendance</h3>
          <div className="mt-5 flex items-center gap-5">
            <Donut present={present} absent={absent} />
            <div className="space-y-3 text-sm">
              <p><span className="mr-2 inline-block size-2.5 rounded-full bg-lime" />Present <strong className="ml-2">{present}</strong></p>
              <p><span className="mr-2 inline-block size-2.5 rounded-full bg-red-400" />Absent <strong className="ml-2">{absent}</strong></p>
              <p className="text-xs text-mist">Based on official marked attendance.</p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-edge bg-panel p-5">
          <h3 className="text-xl">Workout consistency</h3>
          <div className="mt-5 flex h-44 items-end gap-2">
            {workouts.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-xs text-mist">{item.count || ""}</span>
                <div className="flex h-28 w-full items-end rounded-t bg-raised">
                  <div className="w-full rounded-t bg-lime transition-all" style={{ height: `${item.count ? Math.max((item.count / maxWorkout) * 100, 8) : 3}%` }} />
                </div>
                <span className="truncate text-[11px] text-mist">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-mist">Diary entries recorded over the last six months.</p>
        </article>
        <article className="rounded-xl border border-edge bg-panel p-5">
          <h3 className="text-xl">Payment progress</h3>
          <div className="mt-6">
            <div className="flex items-end justify-between"><span className="text-sm text-mist">Paid</span><strong className="text-2xl">{Math.round(paidShare)}%</strong></div>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full bg-lime" style={{ width: `${paidShare}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-mist">Paid</p><p className="mt-1 font-semibold">₹{paid.toLocaleString("en-IN")}</p></div>
              <div><p className="text-mist">Outstanding</p><p className="mt-1 font-semibold text-amber-200">₹{outstanding.toLocaleString("en-IN")}</p></div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
