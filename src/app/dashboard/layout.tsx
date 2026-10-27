import { Shell } from "@/components/shell";
import { getContext } from "@/lib/auth";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { membership, memberships } = await getContext();
  return <Shell membership={membership} memberships={memberships}>{children}</Shell>;
}
