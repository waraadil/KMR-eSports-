import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getTournamentById } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { verifyGatewaySignature } from "@/lib/payments";
import { completeRegistration, RegistrationError } from "@/lib/registration";
import { handleRouteError, jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  orderId: z.string().min(4),
  paymentId: z.string().min(4),
  signature: z.string().min(4),
});

type PaymentRow = {
  id: string;
  order_id: string;
  user_id: string;
  tournament_id: string;
  amount: number;
  gateway: string;
  status: string;
  meta: string;
};

/**
 * Step 2 of checkout: verify the gateway signature and finalise the slot.
 * Idempotent — replayed calls for an already-paid order return the same
 * success payload without double-registering.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Session expired. Log in again.", 401);
    if (!rateLimit(`verify:${clientIp(req)}`, 20, 60_000)) {
      return jsonError("Too many attempts. Wait a moment.", 429);
    }

    const body = verifySchema.parse(await req.json());
    const db = getDb();
    const payment = await db.prepare("SELECT * FROM payments WHERE order_id = ?").get<PaymentRow>(body.orderId);

    if (!payment || payment.user_id !== session.sub) {
      return jsonError("Unknown order.", 404);
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const valid = verifyGatewaySignature({
      gateway: payment.gateway,
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
    });
    if (!valid) {
      await db.prepare("UPDATE payments SET status = 'FAILED' WHERE id = ?").run(payment.id);
      return jsonError("Payment verification failed — signature mismatch.", 400);
    }

    const tournament = await getTournamentById(payment.tournament_id);
    if (!tournament) return jsonError("Tournament not found.", 404);

    const meta = JSON.parse(payment.meta || "{}") as { ign?: string; teamName?: string | null };

    try {
      await db.transaction(async (tx) => {
        await tx.prepare(
          "UPDATE payments SET status = 'PAID', gateway_payment_id = ?, signature = ?, paid_at = ? WHERE id = ?"
        ).run(body.paymentId, body.signature, nowIso(), payment.id);

        await completeRegistration({
          tournament,
          userId: session.sub,
          username: session.username,
          ign: meta.ign || session.username,
          teamName: meta.teamName,
        });

        await tx.prepare(
          `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
           VALUES (?, ?, ?, ?, 'payment', 0, ?)`
        ).run(
          newId("ntf"),
          session.sub,
          "Payment successful",
          `${(payment.amount / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })} paid for ${tournament.title}. Order ${payment.order_id.slice(-8)}.`,
          nowIso()
        );
      });
    } catch (err) {
      if (err instanceof RegistrationError) {
        // Payment succeeded but the lobby filled meanwhile — auto-refund path.
        await db.prepare("UPDATE payments SET status = 'REFUNDED' WHERE id = ?").run(payment.id);
        throw err;
      }
      throw err;
    }

    return NextResponse.json({ ok: true, slug: tournament.slug });
  } catch (err) {
    return handleRouteError(err);
  }
}
