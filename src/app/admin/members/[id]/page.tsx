import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field, Section, SelectField, StatusBadge } from "@/components/ui";
import { MembershipFields } from "@/components/membership-fields";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { formatDate, todayIST } from "@/lib/format";
import { newMembership, recordPayment, reversePayment, resetMemberPassword, setMemberStatus, updateMember } from "../../actions";
import { PaymentDateField } from "@/components/payment-date-field";

type MemberRow = {
  id: string; member_code: string; status: string; address: string | null; joined_on: string;
  profiles: { full_name: string; phone: string | null } | null;
};
type MS = {
  id: string; model: string; start_date: string; end_date: string | null; effective_start_date: string; effective_end_date: string | null; total_days: number | null; fee: number;
  discount: number; extra_charges: number; amount_payable: number; paid: number; outstanding: number; days_remaining: number | null;
  status: string; effective_status: string; notes: string | null;
};
type Pay = { id: string; membership_id: string; amount: number; method: string; paid_on: string; reference: string | null; remarks: string | null; status: string; reversal_reason: string | null };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const methodLabel: Record<string, string> = { cash: "Cash", upi: "UPI", bank: "Bank transfer", other: "Other" };

export default async function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: m }, { data: ms }, { data: pays }, { data: plans }] = await Promise.all([
    supabase.from("members").select("id, member_code, status, address, joined_on, profiles(full_name, phone)").eq("id", id).maybeSingle(),
    supabase.from("membership_financials").select("*").eq("member_id", id).order("start_date", { ascending: false }),
    supabase.from("payments").select("id, membership_id, amount, method, paid_on, reference, remarks, status, reversal_reason").eq("member_id", id).order("paid_on", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("membership_plans").select("id, name, model, default_fee").eq("is_active", true).order("display_order"),
  ]);
  if (!m) notFound();
  const member = m as unknown as MemberRow;
  const memberships = (ms ?? []) as MS[];
  const payments = (pays ?? []) as Pay[];
  const { data: usageRows } = memberships.length
    ? await supabase.from("membership_usage").select("membership_id, days_used, days_remaining").in("membership_id", memberships.map((x) => x.id))
    : { data: [] };
  const usageByMembership = new Map((usageRows ?? []).map((row) => [row.membership_id, row]));
  const current = memberships.find((x) => x.status === "active") ?? memberships.find((x) => x.status !== "cancelled");
  const payable = memberships.filter((x) => x.status !== "cancelled");
  const owing = payable.filter((x) => Number(x.outstanding) > 0);
  const totalOutstanding = owing.reduce((a, x) => a + Number(x.outstanding), 0);

  return (
    <AdminPage title={member.profiles?.full_name || "Member"} current="/admin/members">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-lg">{member.member_code}</span>
        <StatusBadge status={member.status} />
        {current?.effective_status === "expired" && <StatusBadge status="expired" />}
        <span className="text-sm text-mist">Joined {formatDate(member.joined_on)}</span>
      </div>

      <Section title="Summary">
        <div className="grid gap-3 sm:grid-cols-3">
          <Box label="Outstanding balance" value={formatINR(totalOutstanding)} warn={totalOutstanding > 0} />
          <Box label="Current membership" value={current ? (current.model === "calendar" ? `Until ${formatDate(current.effective_end_date)}` : `${current.total_days} gym days`) : "None"} />
          <Box label="Amount payable (current)" value={current ? formatINR(Number(current.amount_payable)) : "—"} />
        </div>
        {current && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Box
              label={current.model === "working_days" ? "Attended gym days" : "Calendar days elapsed"}
              value={current.model === "working_days" ? Number(usageByMembership.get(current.id)?.days_used ?? 0) : "—"}
            />
            <Box
              label="Days remaining"
              value={current.model === "working_days"
                ? Number(usageByMembership.get(current.id)?.days_remaining ?? 0)
                : Number(current.days_remaining ?? 0)}
            />
          </div>
        )}
      </Section>

      <Section title="Record a payment">
        {owing.length === 0 ? (
          <p className="text-mist">Nothing is due. This member has no outstanding balance.</p>
        ) : (
          <ActionForm action={recordPayment} submitLabel="Record payment" className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <input type="hidden" name="member_id" value={member.id} />
            <SelectField label="For membership" name="membership_id" options={owing.map((x) => ({
              value: x.id, label: `${formatDate(x.effective_start_date)} · ${x.model === "calendar" ? "Calendar" : "Gym days"} · due ${formatINR(Number(x.outstanding))}` }))} />
            <Field label="Amount (₹)" name="amount" type="number" min={1} step="1" required />
            <SelectField label="Method" name="method" options={[
              { value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "bank", label: "Bank transfer" }, { value: "other", label: "Other" }]} />
            <PaymentDateField defaultValue={todayIST()} membershipStart={current?.start_date ?? todayIST()} />
            <Field label="Reference" name="reference" maxLength={100} />
            <Field label="Remarks" name="remarks" maxLength={300} />
          </ActionForm>
        )}
      </Section>

      <Section title="Payment history">
        {payments.length === 0 ? <p className="text-mist">No payments yet.</p> : (
          <ul className="grid gap-3">
            {payments.map((p) => (
              <li key={p.id} className="rounded-xl border border-edge bg-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-lg font-semibold ${p.status === "reversed" ? "line-through text-mist" : ""}`}>{formatINR(Number(p.amount))}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm text-mist">
                  {formatDate(p.paid_on)} · {methodLabel[p.method] ?? p.method}{p.reference ? ` · Ref ${p.reference}` : ""}{p.remarks ? ` · ${p.remarks}` : ""}
                </p>
                {p.status === "reversed" && <p className="mt-1 text-sm text-red-300">Reversed: {p.reversal_reason}</p>}
                {p.status === "valid" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-lime">Reverse this payment</summary>
                    <ActionForm action={reversePayment} submitLabel="Reverse payment" buttonClass="btn btn-ghost !min-h-10"
                      confirm="Reverse this payment? It stays in the history but no longer counts." className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <input type="hidden" name="payment_id" value={p.id} />
                      <input type="hidden" name="member_id" value={member.id} />
                      <div className="flex-1"><Field label="Reason" name="reason" required maxLength={200} /></div>
                    </ActionForm>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Memberships">
        {memberships.length === 0 ? <p className="mb-4 text-mist">No memberships yet.</p> : (
          <ul className="mb-6 grid gap-3">
            {memberships.map((x) => (
              <li key={x.id} className="rounded-xl border border-edge bg-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {x.model === "calendar" ? `Calendar: ${formatDate(x.effective_start_date)} to ${formatDate(x.effective_end_date)}` : `${x.total_days} gym days from ${formatDate(x.effective_start_date)}`}
                  </p>
                  <StatusBadge status={x.effective_status} />
                </div>
                <p className="mt-1 text-sm text-mist">
                  Fee {formatINR(Number(x.fee))}
                  {Number(x.discount) > 0 ? ` · Discount ${formatINR(Number(x.discount))}` : ""}
                  {Number(x.extra_charges) > 0 ? ` · Extra ${formatINR(Number(x.extra_charges))}` : ""}
                  {` · Payable ${formatINR(Number(x.amount_payable))} · Paid ${formatINR(Number(x.paid))} · Due ${formatINR(Number(x.outstanding))}`}
                </p>
                <p className="mt-1 text-sm text-mist">
                  {x.model === "working_days"
                    ? `${Number(usageByMembership.get(x.id)?.days_used ?? 0)} attended · ${Number(usageByMembership.get(x.id)?.days_remaining ?? 0)} remaining`
                    : `${Number(x.days_remaining ?? 0)} calendar days remaining`}
                </p>
                {x.notes && <p className="mt-1 text-sm text-mist">{x.notes}</p>}
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-xl border border-edge bg-panel p-4">
          <summary className="cursor-pointer font-semibold text-lime">New or renewed membership</summary>
          <ActionForm action={newMembership} submitLabel="Add membership" className="mt-4 max-w-3xl space-y-4"
            persistKey={`velocity:new-membership:${member.id}`}
            confirm="Add this membership? The current active one will be marked closed (kept in history).">
            <input type="hidden" name="member_id" value={member.id} />
            <MembershipFields plans={plans ?? []} />
          </ActionForm>
        </details>
      </Section>

      <Section title="Details">
        <ActionForm action={updateMember} submitLabel="Save details" className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <input type="hidden" name="member_id" value={member.id} />
          <Field label="Full name" name="full_name" required defaultValue={member.profiles?.full_name} maxLength={120} />
          <Field label="Mobile number" name="phone" type="tel" required defaultValue={member.profiles?.phone} maxLength={15} hint="Primary member contact number · 10 digits" />
          <div className="sm:col-span-2"><Field label="Address" name="address" defaultValue={member.address} maxLength={300} /></div>
        </ActionForm>
      </Section>

      <Section title="Sign-in password">
        <p className="mb-3 max-w-prose text-mist">Forgotten password? Create a new temporary one and give it to the member. The old password stops working.</p>
        <ActionForm action={resetMemberPassword} submitLabel="Create new password" buttonClass="btn btn-ghost" confirm="Create a new password? The current one will stop working.">
          <input type="hidden" name="member_id" value={member.id} />
        </ActionForm>
      </Section>

      <Section title="Account status">
        <p className="mb-3 max-w-prose text-mist">Inactive and suspended members cannot sign in. Nothing is ever deleted. Reactivate any time.</p>
        <div className="flex flex-wrap gap-3">
          {(["active", "inactive", "suspended", "expired"] as const).filter((s) => s !== member.status).map((s) => (
            <ActionForm key={s} action={setMemberStatus} submitLabel={`Mark ${s}`} buttonClass="btn btn-ghost !min-h-10" className="" confirm={`Change status to ${s}?`}>
              <input type="hidden" name="member_id" value={member.id} />
              <input type="hidden" name="status" value={s} />
            </ActionForm>
          ))}
        </div>
      </Section>
    </AdminPage>
  );
}

function Box({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${warn ? "text-amber-300" : ""}`}>{value}</p>
      {warn && <p className="text-xs text-amber-300">Payment pending</p>}
    </div>
  );
}
