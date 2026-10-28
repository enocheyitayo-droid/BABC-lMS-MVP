import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  if (!config) return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
// Supabase refresh belongs to the original dashboard. BABC uses its own
// server-side session checks; public and /portal routes need no Supabase hop.
export const config = { matcher: ["/dashboard/:path*", "/login", "/access"] };
