import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/db";
import { resetPasswordSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { hashResetToken } from "@/lib/resets";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Public: set a new password using a valid reset token. */
export async function POST(req: NextRequest) {
  try {
    const body = resetPasswordSchema.parse(await req.json());
    const db = getDb();

    const row = await db
      .prepare("SELECT id, user_id, expires_at FROM password_resets WHERE token_hash = ? AND status = 'PENDING'")
      .get<{ id: string; user_id: string; expires_at: string }>(hashResetToken(body.token));

    if (!row) return jsonError("This reset link is invalid or has already been used.", 400);
    if (row.expires_at < nowIso()) {
      await db.prepare("UPDATE password_resets SET status = 'CANCELLED' WHERE id = ?").run(row.id);
      return jsonError("This reset link has expired — request a new one.", 400);
    }

    await db.transaction(async (tx) => {
      await tx.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(body.password), row.user_id);
      await tx.prepare("UPDATE password_resets SET status = 'USED' WHERE id = ?").run(row.id);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
