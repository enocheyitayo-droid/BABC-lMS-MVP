import { redirect } from "next/navigation";
import { requireAccount,homeFor } from "@/lib/babc/server";
export default async function PortalPage() { const account=await requireAccount();redirect(homeFor(account.role)); }
