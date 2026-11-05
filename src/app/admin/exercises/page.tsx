import { ActionForm } from "@/components/action-form";
import { AdminPage } from "@/components/admin-page";
import { Field, SelectField } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addExercise, disableExercise } from "./actions";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("exercise_library").select("id, name, exercise_type, category").eq("active", true).order("name");
  return (
    <AdminPage title="Exercise library" current="/admin/exercises">
      <div className="grid gap-8 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-xl border border-edge bg-panel p-5">
          <h2 className="text-2xl">Add exercise option</h2>
          <ActionForm action={addExercise} submitLabel="Add exercise" className="mt-5 space-y-4">
            <Field label="Name" name="name" placeholder="Treadmill walk" required />
            <SelectField label="Type" name="exercise_type" required options={[
              { value: "workout", label: "Workout" }, { value: "attendance", label: "Attendance" }, { value: "missed_day", label: "Missed day" },
            ]} />
            <SelectField label="Workout category" name="category" required options={[
              { value: "upper_body", label: "Upper body" }, { value: "lower_body", label: "Lower body" }, { value: "full_body", label: "Full body" }, { value: "cardio", label: "Cardio" }, { value: "custom", label: "Custom" },
            ]} />
          </ActionForm>
        </section>
        <section className="grid gap-3">
          {(data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-panel p-4"><span><strong>{item.name}</strong><br /><span className="text-sm text-mist">{item.exercise_type} · {item.category}</span></span><ActionForm action={disableExercise} submitLabel="Remove" className="m-0" buttonClass="btn btn-ghost !min-h-9 !px-3 !text-xs"><input type="hidden" name="id" value={item.id} /></ActionForm></div>)}
          {(data ?? []).length === 0 && <p className="text-mist">No exercise options yet.</p>}
        </section>
      </div>
    </AdminPage>
  );
}
