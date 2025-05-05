import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env/client";
import { Database } from "../types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
