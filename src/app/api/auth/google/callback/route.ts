import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb, newId, nowIso } from "@/db";
import { createSession } from "@/lib/auth";
import {
  GOOGLE_STATE_COOKIE,
  exchangeCodeForProfile,
  readOAuthState,
} from "@/lib/google";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#d8ff3e", "#fb7185", "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80",
  "#f97316", "#e879f9", "#22d3ee", "#facc15", "#f87171", "#34d399",
];

function sanitizeNext(raw: string | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

/** Step 2: Google sends the user back here with a code. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  try {
    const errorParam = req.nextUrl.searchParams.get("error");
    if (errorParam) return fail("google_cancelled");

    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    if (!code || !stateRaw) return fail("google_failed");

    // CSRF check: the state must match the cookie we set at step 1.
    const cookieState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
    if (!cookieState || cookieState !== stateRaw) return fail("google_state");
    const state = readOAuthState(stateRaw);
    if (!state) return fail("google_state");

    const profile = await exchangeCodeForProfile(origin, code);
    if (!profile || !profile.email || !profile.emailVerified) {
      return fail("google_failed");
    }

    const db = getDb();
    let user = await db
      .prepare("SELECT id, username, role FROM users WHERE email = ?")
      .get<{ id: string; username: string; role: "PLAYER" | "ORGANIZER" | "ADMIN" }>(
        profile.email
      );

    if (!user) {
      // First Google login → create the fighter profile automatically.
      const base =
        profile.name.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14) ||
        profile.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14) ||
        "Player";
      let username = base;
      for (let i = 0; i < 6; i++) {
        const clash = await db
          .prepare("SELECT id FROM users WHERE username = ?")
          .get(username);
        if (!clash) break;
        username = `${base.slice(0, 12)}${crypto.randomBytes(2).toString("hex")}`;
      }
      const id = newId("usr");
      await db
        .prepare(
          `INSERT INTO users (id, email, username, password_hash, role, avatar_color, bio, wallet_balance, created_at)
           VALUES (?, ?, ?, ?, 'PLAYER', ?, '', 0, ?)`
        )
        .run(
          id,
          profile.email,
          username,
          bcrypt.hashSync(crypto.randomBytes(18).toString("hex"), 10),
          AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          nowIso()
        );
      user = { id, username, role: "PLAYER" };
    }

    await createSession({ id: user.id, username: user.username, role: user.role });

    const res = NextResponse.redirect(new URL(sanitizeNext(state.next), origin));
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("[KMR] Google OAuth callback failed:", err);
    return fail("google_failed");
  }
}
