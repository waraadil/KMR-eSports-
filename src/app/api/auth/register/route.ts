import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#d8ff3e", "#fb7185", "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80", "#f97316", "#e879f9"];

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 8, 60_000)) {
      return jsonError("Too many attempts. Wait a minute and retry.", 429);
    }
    const body = registerSchema.parse(await req.json());
    const db = getDb();

    const clash = db
      .prepare("SELECT email, username FROM users WHERE email = ? OR username = ?")
      .get(body.email.toLowerCase(), body.username) as { email: string; username: string } | undefined;
    if (clash) {
      return jsonError(
        clash.email === body.email.toLowerCase()
          ? "That email is already registered. Log in instead."
          : "That gamertag is taken. Try another.",
        409
      );
    }

    const id = newId("usr");
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, role, avatar_color, bio, wallet_balance, created_at)
       VALUES (?, ?, ?, ?, 'PLAYER', ?, '', 0, ?)`
    ).run(id, body.email.toLowerCase(), body.username, hashPassword(body.password), color, nowIso());

    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
       VALUES (?, ?, 'Welcome to KMR eSports', 'Your account is live. Grab a slot in any open tournament — first one is on us if you pick a free-entry cup.', 'system', 0, ?)`
    ).run(newId("ntf"), id, nowIso());

    await createSession({ id, username: body.username, role: "PLAYER" });
    return NextResponse.json({ ok: true, username: body.username });
  } catch (err) {
    return handleRouteError(err);
  }
}
