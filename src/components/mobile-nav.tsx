"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid size-12 place-items-center rounded-md border border-edge"
      >
        {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="absolute inset-x-0 top-16 border-b border-edge bg-ink px-5 pb-6 pt-2">
          <ul className="divide-y divide-edge">
            {links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-4 text-lg font-medium">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
            Member Login
          </Link>
        </nav>
      )}
    </div>
  );
}
