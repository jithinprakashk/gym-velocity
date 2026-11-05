/** Indian mobile numbers: returns exactly 10 digits, or null if it is not one. Accepts "+91 98765 43210", "09876543210", etc. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^\d{10}$/.test(d) ? d : null;
}

/** The form Supabase Auth stores and expects. */
export function toAuthPhone(tenDigits: string) {
  return `+91${tenDigits}`;
}
