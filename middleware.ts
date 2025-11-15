import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next({ request: { headers: req.headers } });
	const supabase = createMiddlewareClient({ req, res });

	const {
		data: { session },
	} = await supabase.auth.getSession();

	const pathname = req.nextUrl.pathname;
	const isApiRoute = pathname.startsWith("/app/api");
	const isAppRoute = pathname.startsWith("/app") && !isApiRoute;
	const isAuthRoute = pathname === "/auth";

	if (!session && isAppRoute) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = "/auth";
		if (!redirectUrl.searchParams.has("redirectedFrom")) {
			redirectUrl.searchParams.set("redirectedFrom", pathname);
		}
		return NextResponse.redirect(redirectUrl);
	}

	if (session && isAuthRoute) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = "/app/tasks";
		redirectUrl.searchParams.delete("redirectedFrom");
		return NextResponse.redirect(redirectUrl);
	}

	return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
