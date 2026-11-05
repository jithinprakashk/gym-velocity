"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, undefined);
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
