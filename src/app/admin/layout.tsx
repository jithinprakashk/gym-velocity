import { requireRole } from "@/lib/auth";

export const metadata = { title: "Admin | VELOCITY" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin"); // server-side check on every admin page
  return children;
}
