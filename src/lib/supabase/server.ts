// Compatibility import path for older modules during Session 09 cleanup.
// This file contains no Supabase runtime: all callers receive the Neon client.
export { createClient } from "@/lib/neon/client";
