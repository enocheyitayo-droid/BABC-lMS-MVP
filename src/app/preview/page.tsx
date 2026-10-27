import { Shell } from "@/components/shell";
import { Overview } from "@/components/overview";
export default async function Preview({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  return <Shell preview><Overview preview section={section}/></Shell>;
}
