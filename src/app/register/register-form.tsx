"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { registerMember } from "./actions";

type Plan = { id: string; name: string; model: string; default_fee: number };

export function RegisterForm({ plans }: { plans: Plan[] }) {
  const [state, action, pending] = useActionState(registerMember, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const persistKey = "velocity:member-registration";

  useEffect(() => {
    const saved = sessionStorage.getItem(persistKey);
    if (!saved || !formRef.current) return;
    try {
      const values = JSON.parse(saved) as Record<string, string>;
      for (const element of Array.from(formRef.current.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || !element.name) continue;
        if (values[element.name] !== undefined) element.value = values[element.name];
      }
    } catch {
      sessionStorage.removeItem(persistKey);
    }
  }, []);

  return (
    <div className="w-full max-w-lg rounded-xl border border-edge bg-panel p-6 sm:p-8">
      <h1 className="text-4xl">Create your member account</h1>
      <p className="mt-2 text-mist">Verify your email first. A gym administrator will then approve your registration and membership.</p>
      <form ref={formRef} action={action} className="mt-6 grid gap-4" noValidate onSubmit={(event) => {
        const values: Record<string, string> = {};
        for (const [name, value] of new FormData(event.currentTarget).entries()) values[name] = String(value);
        sessionStorage.setItem(persistKey, JSON.stringify(values));
      }}>
        <label className="text-sm">Full name<input name="full_name" required className="field mt-1.5" /></label>
        <label className="text-sm">Email<input name="email" type="email" autoComplete="email" required className="field mt-1.5" /></label>
        <label className="text-sm">Mobile number<input name="phone" type="tel" inputMode="tel" required placeholder="9876543210" className="field mt-1.5" /></label>
        <label className="text-sm">Password<input name="password" type="password" minLength={8} required className="field mt-1.5" /></label>
        <label className="text-sm">Confirm password<input name="confirm" type="password" minLength={8} required className="field mt-1.5" /></label>
        <label className="text-sm">Address (optional)<textarea name="address" rows={2} className="field mt-1.5" /></label>
        <label className="text-sm">Membership plan<select name="plan_id" required className="field mt-1.5"><option value="">Choose a plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} · ₹{Number(p.default_fee).toLocaleString("en-IN")} · {p.model === "calendar" ? "Calendar" : "Gym days"}</option>)}</select></label>
        {plans.length === 0 && <p className="text-sm text-amber-200">No public membership plans are available yet. Ask the gym to publish a plan.</p>}
        {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
        <button disabled={pending || plans.length === 0} className="btn btn-primary">{pending ? "Creating…" : "Create account"}</button>
      </form>
      <Link href="/login" className="mt-5 block text-center text-sm text-lime underline">Back to sign in</Link>
    </div>
  );
}
