import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  amountPaise: z.number().int().min(10000, "Minimum withdrawal is ₹100"),
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.\-]{2,}@[a-zA-Z][a-zA-Z0-9]{1,}$/, "Enter a valid UPI ID (e.g. name@okhdfcbank)"),
});

/**
 * Player withdrawal request: debits the wallet immediately and queues a
 * PENDING withdrawal for the ops team, who settle it manually to the
 * player's UPI ID and mark it PAID (or REJECTED, which refunds the wallet).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized.", 401);
    const { amountPaise, upiId } = schema.parse(await req.json());

    const db = getDb();
    const user = (await db
      .prepare("SELECT wallet_balance FROM users WHERE id = ?")
      .get<{ wallet_balance: number }>(session.sub))!;
    if (amountPaise > user.wallet_balance) return jsonError("Insufficient wallet balance.", 400);

    const existing = await db
      .prepare("SELECT id FROM withdrawals WHERE user_id = ? AND status = 'PENDING'")
      .get(session.sub);
    if (existing) {
      return jsonError("You already have a withdrawal in progress — wait for it to settle.", 409);
    }

    await db.transaction(async (tx) => {
      await tx
        .prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?")
        .run(amountPaise, session.sub);
      await tx
        .prepare(
          `INSERT INTO withdrawals (id, user_id, amount, upi_id, status, created_at)
           VALUES (?, ?, ?, ?, 'PENDING', ?)`
        )
        .run(newId("wd"), session.sub, amountPaise, upiId, nowIso());
      await tx
        .prepare(
          `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at)
           VALUES (?, ?, ?, 'WITHDRAWAL', ?, ?)`
        )
        .run(newId("wtx"), session.sub, -amountPaise, `Withdrawal to ${upiId} (pending settlement)`, nowIso());
      await tx
        .prepare(
          `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
           VALUES (?, ?, ?, ?, 'payment', 0, ?)`
        )
        .run(
          newId("ntf"),
          session.sub,
          "Withdrawal requested",
          `${formatINR(amountPaise)} is queued for payout to ${upiId}. Settled within 24 hours.`,
          nowIso()
        );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
