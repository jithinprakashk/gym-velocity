import { PortalShell } from "./portal-shell";
import { requireRole } from "@/lib/auth";
import { adminNav } from "@/lib/nav";

/** Wraps every admin page: server-side admin check + shared layout. */
export async function AdminPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  const profile = await requireRole("admin");
  return (
    <PortalShell title={title} name={profile.full_name || profile.email} roleLabel="Admin" nav={adminNav} current={current}>
      {children}
    </PortalShell>
  );
}
