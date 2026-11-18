import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { createPasswordReset } from "@/lib/resets";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminResetSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["generate", "resolve"]),
});

/**
 * Admin/organizer: handle a password-reset request.
 * - generate: mint a fresh 30-min token and return the FULL reset link once
 *   (copy it and hand it to the player over WhatsApp/Discord after verifying them)
 * - resolve: cancel any pending tokens for that user (request handled/invalid)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = adminResetSchema.parse(await req.json());
    const db = getDb();

    const user = await db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get<{ id: string; username: string }>(body.userId);
    if (!user) return jsonError("User not found.", 404);

    if (body.action === "resolve") {
      await db
        .prepare("UPDATE password_resets SET status = 'CANCELLED' WHERE user_id = ? AND status = 'PENDING'")
        .run(body.userId);
      return NextResponse.json({ ok: true });
    }

    const { rawToken, expiresAt } = await createPasswordReset(db, user.id, "admin");
    const link = `${req.nextUrl.origin}/reset-password?token=${rawToken}`;
    return NextResponse.json({ ok: true, link, expiresAt, username: user.username });
  } catch (err) {
    return handleRouteError(err);
  }
}
