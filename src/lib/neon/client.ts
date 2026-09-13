"use client";

import { createClient as createNeonClient } from "@neondatabase/neon-js";

export function createClient() {
  const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

  if (!dataApiUrl) {
    throw new Error("Missing NEXT_PUBLIC_NEON_DATA_API_URL.");
  }

  return createNeonClient({
    auth: {
      url: "/api/auth",
    },
    dataApi: {
      url: dataApiUrl,
    },
  });
}
