import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|showcase(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
