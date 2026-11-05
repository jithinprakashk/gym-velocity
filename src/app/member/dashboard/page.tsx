import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { StatCard, StatusBadge } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { Field, SelectField } from "@/components/ui";
import { submitPaymentClaim } from "../payment-claims/actions";
import { MemberCharts } from "./member-charts";

const nav = [
  { label: "Dashboard", href: "/member/dashboard", ready: true },
  { label: "Workout Diary", href: "/member/diary", ready: true },
  { label: "Payments", ready: false },
  { label: "Attendance", ready: false },
];

export default async function MemberDashboard() {
  const profile = await requireRole("member");
  const supabase = await createClient();
  const [{ data: member }, { data: membership }] = await Promise.all([
    supabase.from("members").select("id, member_code").eq("profile_id", profile.id).maybeSingle(),
    supabase.from("current_memberships").select("id, model, start_date, end_date, effective_start_date, effective_end_date, days_remaining, total_days, amount_payable, paid, outstanding, effective_status").maybeSingle(),
  ]);
  const usage = membership?.id ? (await supabase.from("membership_usage").select("days_used, days_remaining").eq("membership_id", membership.id).maybeSingle()).data : null;
  const monthStart = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()).slice(0, 7) + "-01";
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCDate(1);
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
  const chartFrom = sixMonthsAgo.toISOString().slice(0, 10);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const { data: diaryEntries } = member?.id
    ? await supabase.from("workout_diary").select("activity_date, category").eq("member_id", member.id).gte("activity_date", chartFrom).lte("activity_date", today)
    : { data: [] };
  const memberDiary = (diaryEntries ?? []) as { activity_date: string; category: string }[];
  const attendancePoints = [{ label: "This month", present: memberDiary.filter((item) => item.activity_date >= monthStart && !["rest_day", "missed"].includes(item.category)).length, missed: memberDiary.filter((item) => item.activity_date >= monthStart && item.category === "missed").length }];
  const workoutCounts = new Map<string, number>();
  for (let i = 0; i < 6; i += 1) {
    const date = new Date(`${chartFrom}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + i);
    workoutCounts.set(date.toISOString().slice(0, 7), 0);
  }
  for (const entry of diaryEntries ?? []) workoutCounts.set(entry.activity_date.slice(0, 7), (workoutCounts.get(entry.activity_date.slice(0, 7)) ?? 0) + 1);
  const workoutPoints = Array.from(workoutCounts, ([key, count]) => ({ label: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`)), count }));
  return (
    <PortalShell title="My dashboard" name={profile.full_name || profile.email} roleLabel="Member" nav={nav} current="/member/dashboard">
      <p className="text-mist">Member ID: <span className="text-bone">{member?.member_code ?? "—"}</span></p>
      {!member ? <p className="mt-8 rounded-xl border border-amber-400/60 bg-panel p-5 text-amber-200">Your account is pending gym approval. You can sign in, but your member portal will become active after an administrator reviews your registration.</p> : !membership ? <p className="mt-8 rounded-xl border border-edge bg-panel p-5 text-mist">Your registration is approved, but no membership is assigned yet. Please speak to the gym staff.</p> : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Membership" value={membership.model === "calendar" ? "Calendar" : "Gym days"} />
            <StatCard label="Status" value={membership.effective_status} />
            <StatCard label="Days used" value={membership.model === "working_days" ? Number(usage?.days_used ?? 0) : "—"} />
            <StatCard label="Days remaining" value={membership.model === "working_days" ? Number(usage?.days_remaining ?? 0) : Number(membership.days_remaining ?? 0)} />
            <StatCard label="Amount payable" value={formatINR(Number(membership.amount_payable))} />
            <StatCard label="Paid" value={formatINR(Number(membership.paid))} />
            <StatCard label="Outstanding" value={formatINR(Number(membership.outstanding))} hint="Please clear pending balance" />
            <div className="rounded-xl border border-edge bg-panel p-5"><p className="text-sm text-mist">Membership status</p><div className="mt-3"><StatusBadge status={membership.effective_status} /></div></div>
          </div>
          <MemberCharts attendance={attendancePoints} workouts={workoutPoints} paid={Number(membership.paid)} outstanding={Number(membership.outstanding)} />
          <section className="mt-8 max-w-2xl rounded-xl border border-edge bg-panel p-5">
            <h2 className="text-2xl">Submit a payment</h2>
            <p className="mt-2 text-sm text-mist">Tell us when the full membership amount has been paid. Staff will select and confirm the payment date.</p>
            <ActionForm action={submitPaymentClaim} submitLabel="Submit for approval" className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="membership_id" value={membership.id} />
              <div className="rounded-lg border border-edge bg-raised p-3 text-sm"><p className="text-mist">Full amount</p><p className="mt-1 text-xl font-semibold">₹{Number(membership.outstanding).toLocaleString("en-IN")}</p></div>
              <SelectField label="Method" name="method" options={[{ value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "bank", label: "Bank transfer" }, { value: "other", label: "Other" }]} />
              <Field label="Reference" name="reference" />
              <div className="sm:col-span-2"><Field label="Notes" name="notes" /></div>
            </ActionForm>
          </section>
        </>
      )}
    </PortalShell>
  );
}
