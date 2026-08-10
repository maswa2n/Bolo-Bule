import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less Supabase client for build-time / public reads.
 * Uses empty cookie handlers so Next.js can statically render pages.
 * Use only for data guarded by RLS that allows anon access (e.g. published cases).
 */
export function createStaticClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op: static generation has no cookie store.
        },
      },
    },
  );
}
