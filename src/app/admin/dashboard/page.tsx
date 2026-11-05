import { AdminPage } from "@/components/admin-page";
import { StatCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  const s = (data ?? {}) as Record<string, number>;
  const n = (k: string) => Number(s[k] ?? 0);

  return (
    <AdminPage title="Dashboard" current="/admin/dashboard">
      {error && (
        <p role="alert" className="mb-6 rounded-md border border-red-400/60 p-3 text-sm text-red-200">
          Could not load the figures. Check that the Phase 2 database script has been run.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total members" value={n("total_members")} />
        <StatCard label="Active members" value={n("active_members")} />
        <StatCard label="Inactive members" value={n("inactive_members")} hint="Inactive and suspended" />
        <StatCard label="Expired memberships" value={n("expired_memberships")} />
        <StatCard label="Expiring in 7 days" value={n("expiring_soon")} hint="Calendar memberships" />
        <StatCard label="Pending payments" value={formatINR(n("pending_amount"))} hint={`${n("pending_members")} members owe money`} />
        <StatCard label="Collected this month" value={formatINR(n("monthly_collections"))} />
        <StatCard label="Today's attendance" value="—" hint="Arrives with the attendance register" />
      </div>
    </AdminPage>
  );
}
