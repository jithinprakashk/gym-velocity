import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field, Section, SelectField } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { deletePlan, savePlan } from "../actions";

type Plan = {
  id: string; name: string; model: string; default_fee: number; duration_months: number | null; total_days: number | null;
  description: string | null; is_public: boolean; is_active: boolean; display_order: number;
};

function PlanFields({ p }: { p?: Plan }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan name" name="name" required defaultValue={p?.name} maxLength={80} />
        <SelectField label="Model" name="model" defaultValue={p?.model ?? "calendar"} options={[
          { value: "calendar", label: "Calendar-based (valid for a period)" }, { value: "working_days", label: "Gym days (only attended days count)" }]} />
        <Field label="Fee (₹)" name="default_fee" type="number" min={0} step="0.01" required defaultValue={p?.default_fee} />
        <Field label="Months (calendar)" name="duration_months" type="number" min={1} defaultValue={p?.duration_months} />
        <Field label="Gym days (gym-days)" name="total_days" type="number" min={1} defaultValue={p?.total_days} />
        <Field label="Show order" name="display_order" type="number" min={0} defaultValue={p?.display_order ?? 0} />
        <div className="sm:col-span-2"><Field label="Description (shown on the website)" name="description" defaultValue={p?.description} maxLength={300} /></div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex min-h-12 items-center gap-3"><input type="checkbox" name="is_public" defaultChecked={p?.is_public ?? false} className="size-5 accent-lime" /> Show on the public website</label>
        {p && <label className="flex min-h-12 items-center gap-3"><input type="checkbox" name="is_active" defaultChecked={p.is_active} className="size-5 accent-lime" /> Available for new memberships</label>}
      </div>
    </>
  );
}

export default async function PlansPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("membership_plans").select("*").order("display_order");
  const plans = (data ?? []) as Plan[];
  return (
    <AdminPage title="Membership plans" current="/admin/memberships">
      <p className="mb-8 max-w-prose text-mist">
        Plans are templates with default prices. Each member can still get their own fee, discount and dates. Changing a plan never changes existing memberships.
      </p>
      <Section title="Add a plan">
        <ActionForm action={savePlan} submitLabel="Create plan" className="max-w-3xl space-y-4"><PlanFields /></ActionForm>
      </Section>
      <Section title="Your plans">
        {plans.length === 0 ? <p className="text-mist">No plans yet. Add one above. Public plans appear on the website.</p> : (
          <ul className="grid gap-3">
            {plans.map((p) => (
              <li key={p.id}>
                <details className="rounded-xl border border-edge bg-panel p-4">
                  <summary className="cursor-pointer font-semibold">
                    {p.name} <span className="text-mist">· ₹{Number(p.default_fee).toLocaleString("en-IN")} · {p.model === "calendar" ? `${p.duration_months} mo` : `${p.total_days} days`}
                    {p.is_public ? " · public" : " · hidden"}{p.is_active ? "" : " · not available"}</span>
                  </summary>
                  <ActionForm action={savePlan} submitLabel="Save changes" className="mt-4 max-w-3xl space-y-4"><PlanFields p={p} /></ActionForm>
                  <ActionForm action={deletePlan} submitLabel="Delete plan" pendingLabel="Deleting…" confirm="Delete this plan? Used plans cannot be deleted and should be deactivated instead." className="mt-3" buttonClass="btn btn-ghost !min-h-10 !border-red-400/60 !text-red-300">
                    <input type="hidden" name="id" value={p.id} />
                  </ActionForm>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </AdminPage>
  );
}
