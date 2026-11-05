"use client";

import { useActionState, useEffect, useRef } from "react";

export type FormState = { error?: string; message?: string; data?: Record<string, string> } | undefined;

/** Form that runs a server action, shows errors/success, and can ask "are you sure?" first. */
export function ActionForm({
  action, submitLabel, pendingLabel = "Saving…", confirm, className = "space-y-4", buttonClass = "btn btn-primary", persistKey, children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string; pendingLabel?: string; confirm?: string; className?: string; buttonClass?: string;
  persistKey?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!persistKey || !formRef.current) return;
    const saved = sessionStorage.getItem(persistKey);
    if (!saved) return;
    let values: Record<string, string>;
    try {
      values = JSON.parse(saved) as Record<string, string>;
    } catch {
      sessionStorage.removeItem(persistKey);
      return;
    }
    for (const element of Array.from(formRef.current.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) || !element.name) continue;
      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        element.checked = values[element.name] === "on";
      } else if (values[element.name] !== undefined) {
        element.value = values[element.name];
      }
    }
  }, [persistKey, state?.error]);

  useEffect(() => {
    if (persistKey && state?.message && !state.error) sessionStorage.removeItem(persistKey);
  }, [persistKey, state?.message, state?.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        if (persistKey) {
          const values: Record<string, string> = {};
          for (const [name, value] of new FormData(e.currentTarget).entries()) values[name] = String(value);
          for (const input of Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]'))) {
            values[input.name] = input.checked ? "on" : "";
          }
          sessionStorage.setItem(persistKey, JSON.stringify(values));
        }
      }}
    >
      {children}
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-lime">{state.message}</p>}
      {state?.data?.tempPassword && (
        <div role="status" className="rounded-lg border border-lime/50 bg-raised p-4">
          <p className="text-sm text-mist">Temporary password for {state.data.login}. Shown once. Share it with the member and ask them to change it after signing in.</p>
          <p className="mt-2 select-all font-mono text-2xl tracking-wider">{state.data.tempPassword}</p>
          {state.data.memberId && (
            <a href={`/admin/members/${state.data.memberId}`} className="mt-3 inline-block text-sm text-lime underline underline-offset-4">Open member</a>
          )}
        </div>
      )}
      <button type="submit" disabled={pending} className={`${buttonClass} disabled:opacity-60`}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
