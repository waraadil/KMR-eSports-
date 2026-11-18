import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { checkPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
      return jsonError("Too many attempts. Wait a minute and retry.", 429);
    }
    const body = loginSchema.parse(await req.json());
    const db = getDb();

    const user = await db
      .prepare("SELECT * FROM users WHERE email = ? OR username = ?")
      .get<{ id: string; username: string; role: "PLAYER" | "ORGANIZER" | "ADMIN"; password_hash: string }>(
        body.identifier.toLowerCase(),
        body.identifier
      );

    if (!user || !checkPassword(body.password, user.password_hash)) {
      return jsonError("Invalid credentials. Check your details and retry.", 401);
    }

    await createSession({ id: user.id, username: user.username, role: user.role });
    return NextResponse.json({ ok: true, username: user.username, role: user.role });
  } catch (err) {
    return handleRouteError(err);
  }
}
