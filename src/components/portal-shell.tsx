import Link from "next/link";
import { AlertTriangle, CalendarDays, ClipboardCheck, CreditCard, Dumbbell, Image, LayoutDashboard, LogOut, Menu, Settings, Users, ChevronDown } from "lucide-react";
import { Wordmark } from "./wordmark";

type NavItem = { label: string; href?: string; ready: boolean };
const iconByLabel: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard, "My dashboard": LayoutDashboard, "Member Management": Users,
  Approvals: ClipboardCheck, "Official Attendance": CalendarDays, "Attendance Mismatches": AlertTriangle,
  "Membership Management": CreditCard, Payments: CreditCard, "Exercise Library": Dumbbell,
  Reports: LayoutDashboard, "Gallery Management": Image, Settings,
  "Workout Diary": CalendarDays, Attendance: CalendarDays,
};

export function PortalShell({
  title, name, roleLabel, nav, current, children,
}: {
  title: string; name: string; roleLabel: string; nav: NavItem[]; current?: string; children: React.ReactNode;
}) {
  const isMember = roleLabel === "Member";
  return (
    <div className={`portal-shell min-h-screen ${isMember ? "portal-member" : "portal-admin"}`}>
      <header className="portal-header border-b border-edge bg-panel">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-4"><Wordmark /><span className="rounded-full border border-edge px-3 py-1 text-xs font-semibold text-mist">{roleLabel} portal</span></div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-mist sm:inline">{name}</span>
            <form action="/auth/signout" method="post"><button type="submit" className="btn btn-ghost !min-h-10 !px-3 !text-sm"><LogOut aria-hidden className="size-4" /><span className="hidden sm:inline">Sign out</span></button></form>
          </div>
        </div>
      </header>
      <div className="portal-layout mx-auto grid max-w-[1600px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="portal-sidebar">
          <details className="portal-mobile-menu rounded-xl border border-edge bg-panel lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold"><span className="flex items-center gap-2"><Menu className="size-4" />Sections</span><ChevronDown className="size-4" /></summary>
            <PortalNav nav={nav} current={current} />
          </details>
          <nav aria-label={`${roleLabel} sections`} className="portal-desktop-nav hidden lg:block">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.16em] text-mist">Workspace</p>
            <PortalNav nav={nav} current={current} />
          </nav>
          <div className="portal-sidebar-note mt-6 hidden rounded-2xl border border-edge bg-panel p-4 lg:block"><p className="text-xs font-semibold uppercase tracking-wider text-mist">Signed in as</p><p className="mt-2 truncate text-sm font-semibold">{name}</p></div>
        </aside>
        <main id="main" className="min-w-0 pb-20 lg:pb-0">
          <div className="portal-page-heading mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-edge pb-5">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-lime-dark">Velocity · {roleLabel}</p><h1 className="text-3xl sm:text-4xl">{title}</h1></div>
            <p className="hidden text-sm text-mist md:block">Your training, managed with clarity.</p>
          </div>
          {children}
        </main>
      </div>
      {isMember && <nav aria-label="Member quick navigation" className="member-bottom-nav lg:hidden"><ul>{nav.filter((item) => item.ready && item.href).slice(0, 4).map((item) => { const Icon = iconByLabel[item.label] ?? LayoutDashboard; return <li key={item.label}><Link href={item.href!} aria-current={item.href === current ? "page" : undefined} className={item.href === current ? "active" : ""}><Icon aria-hidden className="size-5"/><span>{item.label}</span></Link></li>; })}</ul></nav>}
    </div>
  );
}

function PortalNav({ nav, current }: { nav: NavItem[]; current?: string }) {
  return <ul className="portal-nav-list flex gap-2 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-0">
    {nav.map((item) => {
      const isCurrent = item.href === current;
      const Icon = iconByLabel[item.label] ?? LayoutDashboard;
      const cls = `portal-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm whitespace-nowrap transition-colors ${isCurrent ? "active" : item.ready ? "" : "muted"}`;
      return <li key={item.label} className="shrink-0 lg:w-full">{item.ready && item.href ? <Link href={item.href} className={cls} aria-current={isCurrent ? "page" : undefined}><Icon aria-hidden className="size-4 shrink-0" />{item.label}</Link> : <span className={cls} aria-current={isCurrent ? "page" : undefined}><Icon aria-hidden className="size-4 shrink-0" />{item.label}{!item.ready && <span className="ml-auto text-xs">Soon</span>}</span>}</li>;
    })}
  </ul>;
}
