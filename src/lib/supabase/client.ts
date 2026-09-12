"use client";

import { env } from "@/env";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Supabase client for the browser. Safe to call from any client component. */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
