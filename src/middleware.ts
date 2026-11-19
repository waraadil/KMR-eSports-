import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/api/payments/webhook",
  "/_next/",
  "/assets/",
  "/icons/",
  "/.well-known/",
];

/**
 * This app's data (slots, wallets, room credentials) is time-sensitive and
 * every page is per-user anyway. Forbid caching of any dynamic response so
 * browsers, VPN/proxy services and CDNs can never serve a stale snapshot of
 * a page — a cached page once showed deleted demo tournaments for days.
 */
function noStore<T extends NextResponse>(res: T): T {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    ["/manifest.webmanifest", "/sw.js", "/favicon.ico"].includes(pathname)
  ) {
    return noStore(NextResponse.next());
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return noStore(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return noStore(NextResponse.redirect(url));
  }

  if (pathname.startsWith("/admin") && session.role === "PLAYER") {
    return noStore(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
