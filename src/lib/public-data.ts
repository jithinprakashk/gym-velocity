import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type ContactInfo = {
  address: string;
  phone: string;
  whatsapp: string;
  maps_url: string;
  hours: string;
  instagram: string;
  facebook: string;
};

export type PublicPlan = {
  id: string;
  name: string;
  model: "calendar" | "working_days";
  default_fee: number;
  duration_months: number | null;
  total_days: number | null;
  description: string | null;
};

// Shown until the owner fills these in under Admin → Settings (Phase 4).
export const contactDefaults: ContactInfo = {
  address: "",
  phone: "",
  whatsapp: "",
  maps_url: "",
  hours: "",
  instagram: "",
  facebook: "",
};

export async function getContactInfo(): Promise<ContactInfo> {
  if (!hasSupabaseEnv()) return contactDefaults;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("gym_settings").select("value").eq("key", "contact").maybeSingle();
    return { ...contactDefaults, ...(data?.value ?? {}) };
  } catch {
    return contactDefaults;
  }
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("membership_plans")
      .select("id, name, model, default_fee, duration_months, total_days, description")
      .eq("is_public", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return (data ?? []) as PublicPlan[];
  } catch {
    return [];
  }
}
