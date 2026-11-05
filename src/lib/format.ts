/** "2026-11-05" -> "05 Nov 2026" */
export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${d.slice(0, 10)}T00:00:00Z`),
  );
}

/** Today's date in India as YYYY-MM-DD */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Last day of a period: start + N months - 1 day (e.g. 2026-11-01 + 1 month = 2026-11-30). */
export function endOfPeriod(start: string, months: number) {
  const d = new Date(`${start}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
