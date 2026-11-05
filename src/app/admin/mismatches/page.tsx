import { AdminPage } from "@/components/admin-page";
import { createClient } from "@/lib/supabase/server";

type Mismatch = {
  member_id: string; activity_date: string; admin_status: string | null;
  member_category: string | null; exercise_details: string | null;
  member_code: string; full_name: string | null;
};

export default async function MismatchesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("attendance_mismatches")
    .select("member_id, activity_date, admin_status, member_category, exercise_details, member_code, full_name")
    .order("activity_date", { ascending: false });
  return (
    <AdminPage title="Attendance mismatches" current="/admin/mismatches">
      <p className="max-w-2xl text-mist">These dates need review because the member diary and admin attendance register disagree, or only one side has recorded attendance.</p>
      <div className="mt-6 grid gap-3">
        {(data as Mismatch[] | null ?? []).map((item) => (
          <article key={`${item.member_id}-${item.activity_date}`} className="rounded-xl border border-edge bg-panel p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div><p className="font-semibold">{item.full_name || "(no name)"}</p><p className="text-sm text-mist">{item.member_code} · {item.activity_date}</p></div>
              <p className="text-sm"><strong>Admin:</strong> {item.admin_status ?? "not entered"} · <strong>Member:</strong> {item.member_category ?? "not entered"}</p>
            </div>
            {item.exercise_details && <p className="mt-3 text-sm text-mist">{item.exercise_details}</p>}
          </article>
        ))}
        {(data ?? []).length === 0 && <p className="text-mist">No attendance mismatches found.</p>}
      </div>
    </AdminPage>
  );
}
