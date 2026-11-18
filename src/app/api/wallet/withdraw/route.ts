import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ amountPaise: z.number().int().min(10000, "Minimum withdrawal is ₹100") });

/** Mock withdrawal request — debits the wallet and logs the transaction. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized.", 401);
    const { amountPaise } = schema.parse(await req.json());

    const db = getDb();
    const user = (await db
      .prepare("SELECT wallet_balance FROM users WHERE id = ?")
      .get<{ wallet_balance: number }>(session.sub))!;
    if (amountPaise > user.wallet_balance) return jsonError("Insufficient wallet balance.", 400);

    await db.transaction(async (tx) => {
      await tx.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").run(amountPaise, session.sub);
      await tx.prepare(
        `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at) VALUES (?, ?, ?, 'WITHDRAWAL', 'UPI withdrawal (processing — within 24h)', ?)`
      ).run(newId("wtx"), session.sub, -amountPaise, nowIso());
      await tx.prepare(
        `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (?, ?, ?, ?, 'payment', 0, ?)`
      ).run(
        newId("ntf"), session.sub, "Withdrawal initiated",
        `${formatINR(amountPaise)} is on its way to your linked UPI. Allow up to 24 hours.`, nowIso()
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
