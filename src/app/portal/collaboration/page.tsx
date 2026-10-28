import { SchoolPortal } from "@/components/portal/school-portal";
import { requireAccount } from "@/lib/babc/server";
export const metadata = { title: "Staff workspace" };
export default async function PortalPage() { const account=await requireAccount(["principal","ict","bursar","teacher","academic_lead"]);return <SchoolPortal account={account}/>; }
