import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
