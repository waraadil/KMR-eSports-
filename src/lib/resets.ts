import crypto from "crypto";
import { newId, nowIso, type DbLike } from "@/db";

const RESET_TTL_MIN = 30;

export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Create a password-reset token for a user: cancels any previous pending
 * tokens, stores only the SHA-256 hash, and returns the RAW token once —
 * the only place the full reset link can be built from.
 */
export async function createPasswordReset(
  db: DbLike,
  userId: string,
  via: "self" | "admin"
): Promise<{ rawToken: string; expiresAt: string }> {
  const rawToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60_000).toISOString();

  await db
    .prepare("UPDATE password_resets SET status = 'CANCELLED' WHERE user_id = ? AND status = 'PENDING'")
    .run(userId);
  await db
    .prepare(
      `INSERT INTO password_resets (id, user_id, token_hash, status, requested_via, created_at, expires_at)
       VALUES (?, ?, ?, 'PENDING', ?, ?, ?)`
    )
    .run(newId("pwr"), userId, hashResetToken(rawToken), via, nowIso(), expiresAt);

  return { rawToken, expiresAt };
}
