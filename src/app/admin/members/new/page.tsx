import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field, Section, SelectField } from "@/components/ui";
import { MembershipFields } from "@/components/membership-fields";
import { createMember } from "../../actions";
import { createClient } from "@/lib/supabase/server";
import { todayIST } from "@/lib/format";

export default async function NewMemberPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("membership_plans").select("id, name, model, default_fee").eq("is_active", true).order("display_order");
  return (
    <AdminPage title="Add member" current="/admin/members">
      <ActionForm action={createMember} submitLabel="Create member" pendingLabel="Creating…" persistKey="velocity:new-member" className="max-w-3xl space-y-10">
        <Section title="Member">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="full_name" required maxLength={120} />
            <Field label="Mobile number" name="phone" type="tel" required maxLength={15} hint="Primary member contact · 10 digits" placeholder="9876543210" />
            <Field label="Login email" name="email" type="email" required hint="Used to sign in and reset the password." />
            <Field label="Joining date" name="joined_on" type="date" required defaultValue={todayIST()} />
            <div className="sm:col-span-2"><Field label="Address" name="address" maxLength={300} /></div>
          </div>
        </Section>
        <Section title="Membership"><MembershipFields plans={plans ?? []} /></Section>
        <Section title="Payment at joining (optional)">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex min-h-12 items-center gap-3 sm:col-span-2"><input type="checkbox" name="pay_full_amount" className="size-5 accent-lime" /> Full membership amount paid today</label>
            <SelectField label="Method" name="pay_method" options={[
              { value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "bank", label: "Bank transfer" }, { value: "other", label: "Other" }]} />
            <Field label="Reference" name="pay_reference" maxLength={100} />
          </div>
        </Section>
      </ActionForm>
    </AdminPage>
  );
}
