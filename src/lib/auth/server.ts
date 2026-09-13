import { createNeonAuth } from "@neondatabase/auth/next/server";

// Next.js evaluates route modules during `next build`. CI intentionally does not
// receive live Neon credentials, so use inert build-time fallbacks here rather
// than throwing at module evaluation. Real runtime auth requests still require
// NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in the deployment environment.
const baseUrl = process.env.NEON_AUTH_BASE_URL ?? "http://127.0.0.1:9";
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  "heliocoreos-build-only-cookie-secret-do-not-use-in-runtime";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
