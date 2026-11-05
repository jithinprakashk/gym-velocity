import { requireRole } from "@/lib/auth";

export const metadata = { title: "My Velocity" };

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireRole("member");
  return children;
}
