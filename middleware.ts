import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next({ request: { headers: req.headers } });
	const supabase = createMiddlewareClient({ req, res });

	// Preload the session so server components/routes can rely on cookies being in sync.
	await supabase.auth.getSession();

	return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
