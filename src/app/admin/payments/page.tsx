import Link from "next/link";
import { AdminPage } from "@/components/admin-page";
import { Section, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { formatDate } from "@/lib/format";

type Who = { member_code: string; profiles: { full_name: string } | null };
type Pending = { id: string; member_id: string; outstanding: number; amount_payable: number; members: Who | null };
type Pay = { id: string; member_id: string; amount: number; method: string; paid_on: string; status: string; members: Who | null };
const methodLabel: Record<string, string> = { cash: "Cash", upi: "UPI", bank: "Bank transfer", other: "Other" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const [{ data: pend }, { data: recent }] = await Promise.all([
    supabase.from("membership_financials").select("id, member_id, outstanding, amount_payable, members(member_code, profiles(full_name))")
      .neq("status", "cancelled").gt("outstanding", 0).order("outstanding", { ascending: false }),
    supabase.from("payments").select("id, member_id, amount, method, paid_on, status, members(member_code, profiles(full_name))")
      .order("paid_on", { ascending: false }).order("created_at", { ascending: false }).limit(50),
  ]);
  const pending = (pend ?? []) as unknown as Pending[];
  const payments = (recent ?? []) as unknown as Pay[];
  const total = pending.reduce((a, p) => a + Number(p.outstanding), 0);

  return (
    <AdminPage title="Payments" current="/admin/payments">
      <Section title={`Pending balances · ${formatINR(total)}`}>
        {pending.length === 0 ? <p className="text-mist">No pending payments.</p> : (
          <ul className="grid gap-3">
            {pending.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/members/${p.member_id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge bg-panel p-4 hover:border-lime">
                  <span><span className="font-semibold">{p.members?.profiles?.full_name}</span> <span className="text-sm text-mist">{p.members?.member_code}</span></span>
                  <span className="font-semibold text-amber-300">Owes {formatINR(Number(p.outstanding))} <span className="text-xs text-mist">of {formatINR(Number(p.amount_payable))}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Recent payments">
        {payments.length === 0 ? <p className="text-mist">No payments recorded yet. Record one from a member&apos;s page.</p> : (
          <ul className="grid gap-3">
            {payments.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/members/${p.member_id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge bg-panel p-4 hover:border-lime">
                  <span>
                    <span className="font-semibold">{p.members?.profiles?.full_name}</span>{" "}
                    <span className="text-sm text-mist">{formatDate(p.paid_on)} · {methodLabel[p.method] ?? p.method}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={`font-semibold ${p.status === "reversed" ? "text-mist line-through" : ""}`}>{formatINR(Number(p.amount))}</span>
                    <StatusBadge status={p.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </AdminPage>
  );
}
