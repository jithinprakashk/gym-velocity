import { Field, SelectField } from "./ui";
import { todayIST } from "@/lib/format";

export type PlanOption = { id: string; name: string; model: string; default_fee: number };

/** Shared membership terms fields. Blank fields fall back to the chosen plan's defaults. */
export function MembershipFields({ plans }: { plans: PlanOption[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Plan" name="plan_id" hint="Pick a plan to use its defaults, or choose Custom."
        options={[{ value: "", label: "Custom (no plan)" }, ...plans.map((p) => ({ value: p.id, label: `${p.name} (${p.model === "calendar" ? "calendar" : "gym days"})` }))]} />
      <SelectField label="Model (only for Custom)" name="model" options={[
        { value: "", label: "Use the plan's model" }, { value: "calendar", label: "Calendar-based" }, { value: "working_days", label: "Gym-days based" }]} />
      <Field label="Start date" name="start_date" type="date" required defaultValue={todayIST()} />
      <Field label="End date (calendar)" name="end_date" type="date" hint="Blank = plan's duration from the start date." />
      <Field label="Total gym days (gym-days)" name="total_days" type="number" min={1} hint="Blank = plan's days." />
      <Field label="Fee (₹)" name="fee" type="number" min={0} step="1" hint="Whole rupees only. Blank = plan's fee." />
      <Field label="Discount (₹)" name="discount" type="number" min={0} step="1" />
      <Field label="Extra charges (₹)" name="extra_charges" type="number" min={0} step="1" />
      <div className="sm:col-span-2"><Field label="Notes" name="notes" maxLength={500} /></div>
    </div>
  );
}
