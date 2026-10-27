import { branding } from "@/lib/branding";
import Image from "next/image";
export function Brand({ name = branding.name, compact = false }: { name?: string; compact?: boolean }) {
  return <div className="brand"><Image className="school-logo" src="/brand/teamville-logo.png" width={64} height={64} alt="Teamville Montessori School — raising a total child" priority/>{!compact && <span><strong>{name.startsWith("Teamville") ? "Teamville" : name}</strong><small>{name.startsWith("Teamville") ? "Montessori School" : "School management"}</small></span>}</div>;
}
