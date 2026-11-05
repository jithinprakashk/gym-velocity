"use client";

import { useState } from "react";

export function PaymentDateField({ defaultValue, membershipStart }: { defaultValue?: string; membershipStart: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const delayed = Boolean(value && value > membershipStart);
  return (
    <div>
      <label htmlFor="paid_on" className="mb-1.5 block text-sm font-medium">Payment date <span aria-hidden className="text-lime">*</span></label>
      <input id="paid_on" name="paid_on" type="date" required value={value} onChange={(event) => setValue(event.target.value)} className="field" />
      {delayed && <p role="alert" className="mt-1 text-sm text-amber-300">Delayed payment: this date is after the membership start date ({membershipStart}). It will be highlighted for review.</p>}
    </div>
  );
}
