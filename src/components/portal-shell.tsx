import Link from "next/link";
import { LogOut } from "lucide-react";
import { Wordmark } from "./wordmark";

type NavItem = { label: string; href?: string; ready: boolean };

export function PortalShell({
  title, name, roleLabel, nav, current, children,
}: {
  title: string; name: string; roleLabel: string; nav: NavItem[]; current?: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-edge bg-panel">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Wordmark />
            <span className="rounded border border-edge px-2 py-0.5 text-xs text-mist">{roleLabel}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost !min-h-10 !px-4 !text-sm">
              <LogOut aria-hidden className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="container-x grid gap-8 py-8 lg:grid-cols-[15rem_1fr]">
        <nav aria-label={`${roleLabel} sections`}>
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {nav.map((item) => {
              const isCurrent = item.href === current;
              const cls = `block rounded-md px-3 py-2.5 text-sm whitespace-nowrap ${
                isCurrent ? "bg-raised font-semibold text-lime" : item.ready ? "text-bone hover:bg-raised" : "text-mist"
              }`;
              return (
                <li key={item.label} className="shrink-0">
                  {item.ready && item.href ? (
                    <Link href={item.href} className={cls} aria-current={isCurrent ? "page" : undefined}>{item.label}</Link>
                  ) : (
                    <span className={cls} aria-current={isCurrent ? "page" : undefined}>
                      {item.label}
                      {!item.ready && <span className="ml-2 text-xs">(coming soon)</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="main" className="min-w-0">
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-1 text-mist">Signed in as {name}</p>
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
