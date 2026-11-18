import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { createTournamentSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Admin/organizer: create a tournament. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }

    const body = createTournamentSchema.parse(await req.json());
    const db = getDb();

    const game = db.prepare("SELECT id FROM games WHERE id = ?").get(body.gameId);
    if (!game) return jsonError("Unknown game.", 404);

    let slug = slugify(body.title);
    const clash = db.prepare("SELECT id FROM tournaments WHERE slug = ?").get(slug);
    if (clash) slug = `${slug}-${newId("t").slice(-4)}`;

    // default podium split: 50 / 30 / 20
    const breakdown = [
      { place: "1st", amount: Math.round(body.prizePoolPaise * 0.5) },
      { place: "2nd", amount: Math.round(body.prizePoolPaise * 0.3) },
      { place: "3rd", amount: Math.round(body.prizePoolPaise * 0.2) },
    ];

    const id = newId("trn");
    db.prepare(
      `INSERT INTO tournaments (id, slug, title, game_id, description, rules, format, mode, map, platform,
        entry_fee, prize_pool, prize_breakdown, per_kill_reward, max_slots, starts_at, ends_at, status,
        featured, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, 'UPCOMING', ?, ?, ?)`
    ).run(
      id, slug, body.title, body.gameId, body.description,
      JSON.stringify(body.rules), body.format, body.mode, body.map, body.platform,
      body.entryFeePaise, body.prizePoolPaise, JSON.stringify(breakdown),
      body.maxSlots, new Date(body.startsAt).toISOString(),
      body.featured ? 1 : 0, session.sub, nowIso()
    );

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    return handleRouteError(err);
  }
}
