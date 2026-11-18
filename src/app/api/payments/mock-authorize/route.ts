import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { mockAuthorize } from "@/lib/payments";
import { jsonError } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * MOCK gateway only: simulates the bank/ gateway authorisation step and
 * returns the signed (orderId, paymentId, signature) triple exactly like
 * Razorpay's Checkout handler would — the client then calls /verify.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Session expired.", 401);

  const { orderId } = z.object({ orderId: z.string().min(4) }).parse(await req.json());
  const db = getDb();
  const payment = db
    .prepare("SELECT id, gateway, status, user_id FROM payments WHERE order_id = ?")
    .get(orderId) as { id: string; gateway: string; status: string; user_id: string } | undefined;

  if (!payment || payment.user_id !== session.sub) return jsonError("Unknown order.", 404);
  if (payment.gateway !== "mock") return jsonError("Not a mock order.", 400);
  if (payment.status !== "CREATED") return jsonError("Order already processed.", 409);

  // simulate bank-side processing latency
  await new Promise((r) => setTimeout(r, 900));

  const { paymentId, signature } = mockAuthorize(orderId);
  return NextResponse.json({ ok: true, paymentId, signature });
}
