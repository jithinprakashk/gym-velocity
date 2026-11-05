import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPage } from "@/components/admin-page";
import { SelectField, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { formatDate } from "@/lib/format";

type Row = {
  id: string; member_code: string; status: string;
  profiles: { full_name: string; phone: string | null } | null;
};
type Cur = { member_id: string; model: string; effective_end_date: string | null; total_days: number | null; effective_status: string; outstanding: number };

export default async function MembersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string; pay?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: members }, { data: current }] = await Promise.all([
    supabase.from("members").select("id, member_code, status, profiles(full_name, phone)").order("member_code"),
    supabase.from("current_memberships").select("member_id, model, effective_end_date, total_days, effective_status, outstanding"),
  ]);
  const curBy = new Map<string, Cur>(((current ?? []) as Cur[]).map((c) => [c.member_id, c] as [string, Cur]));

  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = ((members ?? []) as unknown as Row[]).filter((m) => {
    const c = curBy.get(m.id);
    if (q && !`${m.profiles?.full_name ?? ""} ${m.member_code} ${m.profiles?.phone ?? ""}`.toLowerCase().includes(q)) return false;
    if (sp.status && m.status !== sp.status) return false;
    if (sp.pay === "pending" && !(c && Number(c.outstanding) > 0)) return false;
    return true;
  });

  return (
    <AdminPage title="Members" current="/admin/members">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <form className="grid flex-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" role="search">
          <div>
            <label htmlFor="q" className="mb-1.5 block text-sm font-medium">Search name, ID or phone</label>
            <input id="q" name="q" defaultValue={sp.q ?? ""} className="field" />
          </div>
          <SelectField label="Status" name="status" defaultValue={sp.status ?? ""} options={[
            { value: "", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" },
            { value: "suspended", label: "Suspended" }, { value: "expired", label: "Expired" }]} />
          <SelectField label="Payment" name="pay" defaultValue={sp.pay ?? ""} options={[
            { value: "", label: "All" }, { value: "pending", label: "Pending balance" }]} />
          <button className="btn btn-ghost" type="submit">Filter</button>
        </form>
        <Link href="/admin/members/new" className="btn btn-primary"><Plus aria-hidden className="size-5" /> Add member</Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-mist">No members found. Add your first member, or change the search.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {rows.map((m) => {
            const c = curBy.get(m.id);
            return (
              <li key={m.id}>
                <Link href={`/admin/members/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-panel p-4 hover:border-lime">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{m.profiles?.full_name || "(no name)"}</p>
                    <p className="text-sm text-mist">{m.member_code}{m.profiles?.phone ? ` · ${m.profiles.phone}` : ""}</p>
                  </div>
                  <div className="text-sm text-mist">
                    {c ? (c.model === "calendar" ? `Calendar · until ${formatDate(c.effective_end_date)}` : `${c.total_days} gym days`) : "No membership"}
                    {c && Number(c.outstanding) > 0 && <span className="ml-2 font-semibold text-amber-300">Owes {formatINR(Number(c.outstanding))}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {c?.effective_status === "expired" && <StatusBadge status="expired" />}
                    <StatusBadge status={m.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
