import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/** Admin: list withdrawal requests (pending first). */
export async function GET() {
  try {
    if (!(await requireAdminSession())) return jsonError("Admin access required.", 403);
    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT w.id, w.amount, w.upi_id, w.status, w.note, w.created_at, w.processed_at,
                u.username, u.email
         FROM withdrawals w JOIN users u ON u.id = w.user_id
         ORDER BY CASE w.status WHEN 'PENDING' THEN 0 ELSE 1 END, w.created_at DESC
         LIMIT 100`
      )
      .all();
    return NextResponse.json({ ok: true, withdrawals: rows });
  } catch (err) {
    return handleRouteError(err);
  }
}

const actionSchema = z.object({
  id: z.string().min(4),
  action: z.enum(["PAID", "REJECTED"]),
  note: z.string().max(200).optional(),
});

/**
 * Admin: settle a withdrawal.
 * PAID     → money was sent manually to the player's UPI ID; marks settled.
 * REJECTED → refunds the debited amount back to the player's wallet.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) return jsonError("Admin access required.", 403);
    const body = actionSchema.parse(await req.json());

    const db = getDb();
    const w = await db
      .prepare("SELECT id, user_id, amount, upi_id, status FROM withdrawals WHERE id = ?")
      .get<{ id: string; user_id: string; amount: number; upi_id: string; status: string }>(body.id);
    if (!w) return jsonError("Withdrawal not found.", 404);
    if (w.status !== "PENDING") return jsonError("Already processed.", 409);

    await db.transaction(async (tx) => {
      await tx
        .prepare("UPDATE withdrawals SET status = ?, note = ?, processed_at = ? WHERE id = ?")
        .run(body.action, body.note ?? "", nowIso(), w.id);

      if (body.action === "REJECTED") {
        await tx
          .prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?")
          .run(w.amount, w.user_id);
        await tx
          .prepare(
            `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at)
             VALUES (?, ?, ?, 'WITHDRAWAL_REFUND', 'Withdrawal rejected — refunded to wallet', ?)`
          )
          .run(newId("wtx"), w.user_id, w.amount, nowIso());
      }

      await tx
        .prepare(
          `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
           VALUES (?, ?, ?, ?, 'payment', 0, ?)`
        )
        .run(
          newId("ntf"),
          w.user_id,
          body.action === "PAID" ? "Withdrawal paid" : "Withdrawal rejected",
          body.action === "PAID"
            ? `${formatINR(w.amount)} was sent to ${w.upi_id}. Check your bank/UPI app.`
            : `${formatINR(w.amount)} withdrawal to ${w.upi_id} was rejected and refunded to your KMR wallet.`,
          nowIso()
        );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
