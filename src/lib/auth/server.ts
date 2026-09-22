import { createNeonAuth } from "@neondatabase/auth/next/server";

// The integration branch must remain usable on Vercel preview deployments even
// when branch-scoped environment variables have not yet been copied across.
// These endpoint URLs are public Neon service endpoints; credentials and the
// cookie secret still come from environment variables when configured.
const baseUrl =
  process.env.NEON_AUTH_BASE_URL ??
  "https://ep-autumn-fog-za48gvtr.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth";

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  "heliocoreos-preview-only-cookie-secret-do-not-use-for-production";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
