"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addExercise(_prev: { error?: string; message?: string } | undefined, fd: FormData) {
  const profile = await requireRole("admin");
  const parsed = z.object({
    name: z.string().trim().min(1).max(160),
    exercise_type: z.enum(["workout", "attendance", "missed_day"]),
    category: z.enum(["upper_body", "lower_body", "full_body", "cardio", "custom"]),
  }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Enter a valid exercise name and type." };
  const supabase = await createClient();
  const { error } = await supabase.from("exercise_library").insert({ ...parsed.data, created_by: profile.id });
  if (error) return { error: "Could not add exercise." };
  revalidatePath("/admin/exercises");
  revalidatePath("/member/diary");
  return { message: "Exercise added." };
}

export async function disableExercise(_prev: { error?: string; message?: string } | undefined, fd: FormData) {
  await requireRole("admin");
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return { error: "Invalid exercise." };
  const supabase = await createClient();
  const { error } = await supabase.from("exercise_library").update({ active: false }).eq("id", id.data);
  if (error) return { error: "Could not remove exercise." };
  revalidatePath("/admin/exercises");
  revalidatePath("/member/diary");
  return { message: "Exercise removed." };
}
