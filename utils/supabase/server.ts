import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasRealSupabaseUrl =
	!!supabaseUrl &&
	supabaseUrl !== "https://your-project.supabase.co" &&
	!supabaseUrl.includes("example.supabase.co");

export function isSupabaseConfigured() {
	return hasRealSupabaseUrl && !!supabaseAnonKey && supabaseAnonKey !== "public-anon-key";
}

export function getSupabaseServerClient() {
	if (!isSupabaseConfigured()) {
		throw new Error("Supabase environment variables are not configured.");
	}

	const cookieStore = cookies();

	return createServerClient(supabaseUrl!, supabaseAnonKey!, {
		cookies: {
			getAll() {
				return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
			},
		},
	});
}
