import { CheckCircle2, CircleAlert, Clock, PauseCircle, XCircle } from "lucide-react";

export function Field({
  label, name, type = "text", defaultValue, required, hint, placeholder, min, step, maxLength,
}: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; required?: boolean;
  hint?: string; placeholder?: string; min?: number | string; step?: string; maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}{required && <span aria-hidden className="text-lime"> *</span>}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder}
        min={min} step={step} maxLength={maxLength} inputMode={type === "number" ? "decimal" : undefined} className="field" />
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label, name, options, defaultValue, required, hint,
}: {
  label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue ?? ""} required={required} className="field">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

const badgeMap: Record<string, { icon: typeof CheckCircle2; cls: string; text: string }> = {
  active: { icon: CheckCircle2, cls: "border-lime/60 text-lime", text: "Active" },
  inactive: { icon: PauseCircle, cls: "border-mist/60 text-mist", text: "Inactive" },
  suspended: { icon: XCircle, cls: "border-red-400/60 text-red-300", text: "Suspended" },
  expired: { icon: CircleAlert, cls: "border-amber-400/60 text-amber-300", text: "Expired" },
  closed: { icon: Clock, cls: "border-mist/60 text-mist", text: "Closed" },
  cancelled: { icon: XCircle, cls: "border-red-400/60 text-red-300", text: "Cancelled" },
  valid: { icon: CheckCircle2, cls: "border-lime/60 text-lime", text: "Valid" },
  reversed: { icon: XCircle, cls: "border-red-400/60 text-red-300", text: "Reversed" },
};

/** Status shown with an icon AND a word, never colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const b = badgeMap[status] ?? badgeMap.inactive;
  const Icon = b.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${b.cls}`}>
      <Icon aria-hidden className="size-3.5" /> {b.text}
    </span>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-4 text-3xl">{title}</h2>
      {children}
    </section>
  );
}
