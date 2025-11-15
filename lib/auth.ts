import { getSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireUser() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  return user;
}
