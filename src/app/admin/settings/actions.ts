"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;
const schema = z.object({
  address: z.string().trim().max(500),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  maps_url: z.string().trim().max(1000),
  hours: z.string().trim().max(500),
  instagram: z.string().trim().max(500),
  facebook: z.string().trim().max(500),
});

export async function saveContactSettings(_prev: State, fd: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the settings form." };
  const supabase = await createClient();
  const { error } = await supabase.from("gym_settings").upsert({ key: "contact", value: parsed.data });
  if (error) return { error: "Could not save settings. Confirm the Phase 1 database migration is applied." };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { message: "Contact settings saved." };
}
