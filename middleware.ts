import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Prisma client for middleware
const prisma = new PrismaClient();

export async function middleware(req: NextRequest) {
	const res = NextResponse.next({ request: { headers: req.headers } });

	if (!supabaseUrl || !supabaseAnonKey) {
		return res;
	}

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookieEncoding: "base64url",
		cookies: {
			getAll() {
				return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
			},
			setAll(cookies) {
				cookies.forEach(({ name, value, options }) => {
					res.cookies.set({ name, value, ...options });
				});
			},
		},
	});

	const {
		data: { session },
	} = await supabase.auth.getSession();

	const pathname = req.nextUrl.pathname;
	const isApiRoute = pathname.startsWith("/app/api");
	const isAppRoute = pathname.startsWith("/app") && !isApiRoute;
	const isAuthRoute = pathname === "/auth";
	const isOnboardingRoute = pathname === "/app/onboarding";

	// Redirect unauthenticated users to auth page
	if (!session && isAppRoute) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = "/auth";
		if (!redirectUrl.searchParams.has("redirectedFrom")) {
			redirectUrl.searchParams.set("redirectedFrom", pathname);
		}
		return NextResponse.redirect(redirectUrl);
	}

	// Redirect authenticated users away from auth page
	if (session && isAuthRoute) {
		const redirectUrl = req.nextUrl.clone();

		// Check if user has completed onboarding
		try {
			const userSettings = await prisma.userSettings.findUnique({
				where: { userId: session.user.id },
				select: { onboardingComplete: true },
			});

			// If no settings or onboarding not complete, redirect to onboarding
			if (!userSettings || !userSettings.onboardingComplete) {
				redirectUrl.pathname = "/app/onboarding";
			} else {
				redirectUrl.pathname = "/app/tasks";
			}
		} catch (error) {
			// If there's an error checking, default to tasks page
			redirectUrl.pathname = "/app/tasks";
		}

		redirectUrl.searchParams.delete("redirectedFrom");
		return NextResponse.redirect(redirectUrl);
	}

	// Check onboarding status for authenticated users accessing app routes
	if (session && isAppRoute && !isOnboardingRoute) {
		try {
			const userSettings = await prisma.userSettings.findUnique({
				where: { userId: session.user.id },
				select: { onboardingComplete: true },
			});

			// If no settings or onboarding not complete, redirect to onboarding
			if (!userSettings || !userSettings.onboardingComplete) {
				const redirectUrl = req.nextUrl.clone();
				redirectUrl.pathname = "/app/onboarding";
				return NextResponse.redirect(redirectUrl);
			}
		} catch (error) {
			// If there's an error, let the request continue
			console.error("Error checking onboarding status:", error);
		}
	}

	return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
