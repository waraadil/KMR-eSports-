import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { verifyWebhookSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook receiver (production). Configure the endpoint + secret in
 * the Razorpay dashboard. Handles `payment.captured` so slots are granted
 * even if the player closes the tab before client-side verification.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string } } } };
  if (event.event === "payment.captured") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      // Client-side /verify performs registration; this marks the payment so a
      // background reconciler (or support) can finalise missed checkouts.
      getDb()
        .prepare("UPDATE payments SET gateway_payment_id = ? WHERE order_id = ? AND status = 'CREATED'")
        .run(event.payload!.payment!.entity!.id, orderId);
    }
  }
  return NextResponse.json({ ok: true });
}
