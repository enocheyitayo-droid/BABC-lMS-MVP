import { demoEnabled } from "@/lib/demo/store";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function DemoLayout({children}:{children:React.ReactNode}) { if(!demoEnabled()) notFound(); return children; }
