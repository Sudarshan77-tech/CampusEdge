import { createBrowserClient } from '@supabase/ssr';
import { getWebEnv } from '../env';

export function createClient() {
  const env = getWebEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
