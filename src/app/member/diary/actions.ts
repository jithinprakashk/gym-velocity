"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;
const schema = z.object({
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  category: z.enum(["upper_body", "lower_body", "full_body", "cardio", "custom", "rest_day", "missed"]),
  title: z.string().trim().max(120).optional(),
  exercise_details: z.string().trim().max(2000).optional(),
  sets: z.coerce.number().int().positive().optional().or(z.literal("")),
  repetitions: z.coerce.number().int().positive().optional().or(z.literal("")),
  weight_kg: z.coerce.number().nonnegative().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export async function saveDiary(_prev: State, fd: FormData): Promise<State> {
  const profile = await requireRole("member");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the diary form." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data: memberId, error: memberError } = await supabase.rpc("my_member_id");
  if (memberError || !memberId) return { error: "Your member record could not be found." };
  const { error } = await supabase.from("workout_diary").upsert({
    member_id: memberId,
    activity_date: v.activity_date,
    category: v.category,
    title: v.title || null,
    exercise_details: v.exercise_details || null,
    sets: v.sets === "" ? null : v.sets,
    repetitions: v.repetitions === "" ? null : v.repetitions,
    weight_kg: v.weight_kg === "" ? null : v.weight_kg,
    notes: v.notes || null,
  }, { onConflict: "member_id,activity_date" });
  if (error) return { error: "Could not save this diary entry." };
  revalidatePath("/member/diary");
  revalidatePath("/member/dashboard");
  return { message: `Diary entry saved for ${profile.full_name || "you"}.` };
}

export async function deleteDiary(_prev: State, fd: FormData): Promise<State> {
  await requireRole("member");
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return { error: "Invalid diary entry." };
  const supabase = await createClient();
  const { error } = await supabase.from("workout_diary").delete().eq("id", id.data);
  if (error) return { error: "Could not delete this diary entry." };
  revalidatePath("/member/diary");
  return { message: "Diary entry removed." };
}
