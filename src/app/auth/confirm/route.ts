import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(
    new URL(
      "/login?message=Authentication%20is%20now%20handled%20by%20Neon%20Managed%20Better%20Auth.",
      requestUrl.origin,
    ),
  );
}
