import { createClient as createNeonClient } from "@neondatabase/neon-js";

export function createClient() {
  const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

  if (!dataApiUrl) {
    throw new Error("Missing NEXT_PUBLIC_NEON_DATA_API_URL.");
  }

  const client = createNeonClient({
    auth: {
      url: "/api/auth",
    },
    dataApi: {
      url: dataApiUrl,
    },
  });

  // Keep the former Supabase-shaped getUser response temporarily so legacy
  // server modules can move to the Neon Data API without changing their
  // authorization checks in the same release.
  const auth = Object.assign(client.auth, {
    async getUser() {
      const session = await client.auth.getSession();
      return {
        data: { user: session.data?.user ?? null },
        error: null,
      };
    },
  });

  return Object.assign(client, { auth });
}
