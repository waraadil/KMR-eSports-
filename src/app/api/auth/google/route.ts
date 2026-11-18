import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  consentUrl,
  googleEnabled,
  newOAuthState,
} from "@/lib/google";

export const dynamic = "force-dynamic";

/** Step 1: bounce the user to Google's consent screen. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google_off", origin));
  }

  const rawNext = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const state = newOAuthState(next);
  const res = NextResponse.redirect(consentUrl(origin, state));
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https"),
    maxAge: 300, // 5 minutes
    path: "/",
  });
  return res;
}
