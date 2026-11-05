"use client";

import Link from "next/link";

type DiaryEntry = { activity_date: string; category: string; title?: string | null };
type Holiday = { holiday_date: string; title: string };

const categoryLabels: Record<string, string> = {
  upper_body: "Upper", lower_body: "Lower", full_body: "Full",
  cardio: "Cardio", custom: "Workout", rest_day: "Rest", missed: "Missed",
};

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function WorkoutCalendar({
  month, entries, holidays,
}: {
  month: string; entries: DiaryEntry[]; holidays: Holiday[];
}) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((mondayOffset + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - mondayOffset + 1;
    return day > 0 && day <= daysInMonth ? dateKey(year, monthNumber, day) : null;
  });
  const entryByDate = new Map(entries.map((entry) => [entry.activity_date, entry]));
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.holiday_date, holiday.title]));
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 7);
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const attended = entries.filter((entry) => !["rest_day", "missed"].includes(entry.category)).length;
  const missed = entries.filter((entry) => entry.category === "missed").length;
  const marked = attended + missed;

  return (
    <section className="rounded-xl border border-edge bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Workout calendar</h2>
          <p className="mt-1 text-sm text-mist">Attendance here is based on your workout diary. Rest days are not counted as attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/member/diary?month=${previous}`} className="btn btn-ghost !min-h-9 !px-3" aria-label="Previous month">‹</Link>
          <span className="min-w-36 text-center font-semibold">{label}</span>
          <Link href={`/member/diary?month=${next}`} className="btn btn-ghost !min-h-9 !px-3" aria-label="Next month">›</Link>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-edge p-3"><p className="text-xs text-mist">Attended</p><p className="mt-1 text-2xl font-bold text-lime">{attended}</p></div>
        <div className="rounded-lg border border-edge p-3"><p className="text-xs text-mist">Missed</p><p className="mt-1 text-2xl font-bold text-red-300">{missed}</p></div>
        <div className="rounded-lg border border-edge p-3"><p className="text-xs text-mist">Unmarked</p><p className="mt-1 text-2xl font-bold">{Math.max(daysInMonth - marked, 0)}</p></div>
      </div>
      <p className="mt-3 text-sm text-mist">{marked ? `${Math.round((attended / marked) * 100)}% attendance rate based on your marked days.` : "Record a workout or missed day to calculate your rate."}</p>
      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="py-2 font-semibold text-mist">{day}</div>)}
        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-24 rounded-lg bg-raised/30" />;
          const entry = entryByDate.get(date);
          const status = entry && entry.category === "missed" ? "absent" : entry && entry.category !== "rest_day" ? "present" : undefined;
          const holiday = holidayByDate.get(date);
          const closed = Boolean(holiday) || new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
          return (
            <div key={date} className={`min-h-24 rounded-lg border p-2 text-left ${closed ? "border-edge/50 bg-raised/40" : "border-edge bg-raised"}`}>
              <div className="flex items-center justify-between"><span className="font-semibold">{Number(date.slice(-2))}</span>{status === "present" ? <span className="text-lime">✓</span> : status === "absent" ? <span className="text-red-300">×</span> : null}</div>
              {closed && <p className="mt-2 truncate text-[10px] text-mist">{holiday ?? "Sunday"}</p>}
              {entry && <p className="mt-2 truncate rounded bg-lime/10 px-1 py-0.5 text-[10px] text-lime" title={entry.title ?? undefined}>{categoryLabels[entry.category] ?? "Workout"}</p>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-mist"><span><span className="text-lime">✓</span> Attended</span><span><span className="text-red-300">×</span> Missed</span><span>Rest day is not attendance</span><span>Closed day</span></div>
    </section>
  );
}
