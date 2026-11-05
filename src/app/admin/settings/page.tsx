import { AdminPage } from "@/components/admin-page";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { contactDefaults } from "@/lib/public-data";
import { saveContactSettings } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("gym_settings").select("value").eq("key", "contact").maybeSingle();
  const contact = { ...contactDefaults, ...((data?.value ?? {}) as Partial<typeof contactDefaults>) };
  return (
    <AdminPage title="Settings" current="/admin/settings">
      <div className="max-w-2xl rounded-xl border border-edge bg-panel p-5 sm:p-8">
        <h2 className="text-3xl">Public contact details</h2>
        <p className="mt-2 text-sm text-mist">These values appear on the public homepage. Leave a field blank if it is not ready yet.</p>
        <ActionForm action={saveContactSettings} submitLabel="Save settings" className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Gym address" name="address" defaultValue={contact.address} /></div>
          <Field label="Phone number" name="phone" defaultValue={contact.phone} />
          <Field label="WhatsApp number" name="whatsapp" defaultValue={contact.whatsapp} />
          <div className="sm:col-span-2"><Field label="Google Maps link" name="maps_url" type="url" defaultValue={contact.maps_url} /></div>
          <div className="sm:col-span-2"><Field label="Business hours" name="hours" defaultValue={contact.hours} placeholder="Mon-Sat: 6:00 AM - 10:00 PM" /></div>
          <Field label="Instagram link" name="instagram" type="url" defaultValue={contact.instagram} />
          <Field label="Facebook link" name="facebook" type="url" defaultValue={contact.facebook} />
        </ActionForm>
      </div>
    </AdminPage>
  );
}
