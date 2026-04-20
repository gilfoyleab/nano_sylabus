"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const { url, key } = getSupabaseEnv();
  client = createBrowserClient(url, key);
  return client;
}
