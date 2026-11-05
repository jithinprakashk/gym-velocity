import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field, SelectField } from "@/components/ui";
import { todayIST } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { approveRegistration, reviewClaim } from "./actions";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const [{ data: requests }, { data: plans }, { data: claims }] = await Promise.all([
    supabase.from("member_registration_requests").select("id, profile_id, requested_plan_id, address, created_at, profiles!member_registration_requests_profile_id_fkey(full_name, phone)").eq("status", "pending").order("created_at"),
    supabase.from("membership_plans").select("id, name, model, default_fee").eq("is_active", true).order("display_order"),
    supabase.from("payment_claims").select("id, amount, method, paid_on, reference, notes, members(member_code, profiles(full_name))").eq("status", "pending").order("created_at"),
  ]);
  return <AdminPage title="Approvals" current="/admin/approvals">
    <section><h2 className="text-3xl">Member registrations</h2><ul className="mt-4 grid gap-3">{(requests ?? []).map((r) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return <li key={r.id} className="rounded-xl border border-edge bg-panel p-4"><p className="font-semibold">{profile?.full_name} · {profile?.phone}</p><p className="text-sm text-mist">{r.address || "No address provided"}</p><ActionForm action={approveRegistration} submitLabel="Approve and create membership" className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="request_id" value={r.id} /><SelectField label="Plan" name="plan_id" required options={(plans ?? []).map((p) => ({ value: p.id, label: `${p.name} · ₹${Number(p.default_fee).toLocaleString("en-IN")}` }))} defaultValue={r.requested_plan_id ?? ""} /><Field label="Fee" name="fee" type="number" min={0} step="0.01" required defaultValue={(plans ?? []).find((p) => p.id === r.requested_plan_id)?.default_fee} /></ActionForm></li>;
    })}</ul>{(requests ?? []).length === 0 && <p className="mt-4 text-mist">No pending registrations.</p>}</section>
    <section className="mt-12"><h2 className="text-3xl">Payment claims</h2><ul className="mt-4 grid gap-3">{(claims ?? []).map((c) => { const m = Array.isArray(c.members) ? c.members[0] : c.members; const p = Array.isArray(m?.profiles) ? m.profiles[0] : m?.profiles; return <li key={c.id} className="rounded-xl border border-edge bg-panel p-4"><p className="font-semibold">{p?.full_name} · ₹{Number(c.amount).toLocaleString("en-IN")}</p><p className="text-sm text-mist">Method: {c.method}{c.reference ? ` · Ref ${c.reference}` : ""}</p><div className="mt-3 flex flex-wrap items-end gap-3"><ActionForm action={reviewClaim} submitLabel="Approve" className="m-0 flex flex-wrap items-end gap-2" buttonClass="btn btn-primary !min-h-9 !text-xs"><input type="hidden" name="claim_id" value={c.id} /><input type="hidden" name="status" value="approved" /><Field label="Payment date" name="paid_on" type="date" defaultValue={todayIST()} required /></ActionForm><ActionForm action={reviewClaim} submitLabel="Reject" className="m-0" buttonClass="btn btn-ghost !min-h-9 !text-xs"><input type="hidden" name="claim_id" value={c.id} /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="paid_on" value={todayIST()} /></ActionForm></div></li>; })}</ul>{(claims ?? []).length === 0 && <p className="mt-4 text-mist">No pending payment claims.</p>}</section>
  </AdminPage>;
}
