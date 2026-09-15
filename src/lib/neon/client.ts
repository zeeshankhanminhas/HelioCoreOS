import { createClient as createNeonClient } from "@neondatabase/neon-js";

function resolveAuthUrl() {
  if (typeof window !== "undefined") return "/api/auth";

  const explicitBase = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (explicitBase) return `${explicitBase.replace(/\/$/, "")}/api/auth`;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) {
    const absoluteBase = /^https?:\/\//i.test(vercelHost) ? vercelHost : `https://${vercelHost}`;
    return `${absoluteBase.replace(/\/$/, "")}/api/auth`;
  }

  return "http://localhost:3000/api/auth";
}

export function createClient() {
  const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

  if (!dataApiUrl) {
    throw new Error("Missing NEXT_PUBLIC_NEON_DATA_API_URL.");
  }

  const client = createNeonClient({
    auth: {
      url: resolveAuthUrl(),
    },
    dataApi: {
      url: dataApiUrl,
    },
  });

  // Transitional response-shape compatibility for older server actions.
  // The underlying identity and data runtime is Neon Auth + Neon Data API.
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
