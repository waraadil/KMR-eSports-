import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getTournamentById, getRegistrationFor } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { createGatewayOrder, paymentMode, publicRazorpayKeyId } from "@/lib/payments";
import { registrationInputSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Step 1 of checkout: create a payment order for a paid tournament slot.
 * Returns everything the client needs to open Razorpay Checkout (or the
 * built-in mock gateway when keys aren't configured).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Log in to register for tournaments.", 401);
    if (!rateLimit(`order:${session.sub}`, 12, 60_000)) {
      return jsonError("Slow down — too many payment attempts.", 429);
    }

    const body = registrationInputSchema.parse(await req.json());
    const tournament = await getTournamentById(body.tournamentId);
    if (!tournament) return jsonError("Tournament not found.", 404);
    if (tournament.status !== "UPCOMING" && tournament.status !== "LIVE") {
      return jsonError("Registrations are closed for this tournament.", 409);
    }
    if (tournament.entry_fee <= 0) return jsonError("This tournament is free — no payment needed.", 400);
    if (await getRegistrationFor(tournament.id, session.sub)) {
      return jsonError("You already have a slot in this tournament.", 409);
    }
    if (tournament.filled_slots >= tournament.max_slots) {
      return jsonError("Lobby is full — all slots are taken.", 409);
    }

    const db = getDb();
    const receipt = newId("rcpt").slice(0, 32);
    const order = await createGatewayOrder({
      amountPaise: tournament.entry_fee,
      receipt,
      notes: { tournamentId: tournament.id, userId: session.sub },
    });

    await db.prepare(
      `INSERT INTO payments (id, order_id, user_id, tournament_id, amount, currency, gateway, meta, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?)`
    ).run(
      newId("pay"),
      order.orderId,
      session.sub,
      tournament.id,
      order.amount,
      order.currency,
      order.gateway,
      JSON.stringify({ ign: body.ign, teamName: body.teamName ?? null }),
      nowIso()
    );

    return NextResponse.json({
      ok: true,
      mode: paymentMode(),
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.gateway === "razorpay" ? publicRazorpayKeyId() : null,
      tournament: { title: tournament.title, slug: tournament.slug },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
