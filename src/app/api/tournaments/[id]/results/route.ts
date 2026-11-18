import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { resultsSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { placementPoints, killPoints, CURRENT_SEASON } from "@/lib/points";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

type PrizeSlice = { place: string; amount: number };
const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

/**
 * Admin: submit final standings for a tournament.
 * One atomic transaction → placements, points table entries, wallet prize
 * credits, notifications, and the tournament flips to COMPLETED.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = resultsSchema.parse(await req.json());
    const db = getDb();

    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(params.id) as
      | { id: string; title: string; status: string; prize_breakdown: string }
      | undefined;
    if (!tournament) return jsonError("Tournament not found.", 404);
    if (tournament.status === "COMPLETED") {
      return jsonError("Results already published for this tournament.", 409);
    }

    const breakdown = JSON.parse(tournament.prize_breakdown || "[]") as PrizeSlice[];
    const mvpSlice = breakdown.find((b) => b.place.toUpperCase() === "MVP");
    const mvp = mvpSlice
      ? [...body.results].sort((a, b) => b.kills - a.kills)[0]
      : null;

    db.transaction(() => {
      for (const r of body.results) {
        const pp = placementPoints(r.placement);
        const kp = killPoints(r.kills);
        const isMvp = mvp && mvp.userId === r.userId && mvpSlice;
        const prize =
          (breakdown.find((b) => b.place === ordinal(r.placement ?? -1))?.amount ?? 0) +
          (isMvp ? mvpSlice!.amount : 0);

        db.prepare(
          "UPDATE registrations SET placement = ?, kills = ? WHERE tournament_id = ? AND user_id = ?"
        ).run(r.placement, r.kills, params.id, r.userId);

        db.prepare(
          `INSERT INTO leaderboard_entries
             (id, user_id, tournament_id, season, placement, kills, placement_points, kill_points, bonus_points, total_points, prize_won, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
           ON CONFLICT (user_id, tournament_id)
           DO UPDATE SET placement = excluded.placement, kills = excluded.kills,
             placement_points = excluded.placement_points, kill_points = excluded.kill_points,
             total_points = excluded.total_points, prize_won = excluded.prize_won`
        ).run(newId("lbe"), r.userId, params.id, CURRENT_SEASON, r.placement, r.kills, pp, kp, pp + kp, prize, nowIso());

        if (prize > 0) {
          db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(prize, r.userId);
          db.prepare(
            `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at) VALUES (?, ?, ?, 'PRIZE_CREDIT', ?, ?)`
          ).run(newId("wtx"), r.userId, prize, `${ordinal(r.placement ?? 0)} place — ${tournament.title}`, nowIso());
          db.prepare(
            `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (?, ?, ?, ?, 'prize', 0, ?)`
          ).run(
            newId("ntf"), r.userId, "Prize credited",
            `${formatINR(prize)} from ${tournament.title} hit your KMR wallet. GG!`, nowIso()
          );
        }
      }

      db.prepare("UPDATE tournaments SET status = 'COMPLETED', ends_at = ? WHERE id = ?").run(nowIso(), params.id);

      // notify everyone else who played
      const others = db
        .prepare(
          `SELECT user_id FROM registrations WHERE tournament_id = ? AND status = 'CONFIRMED'
           AND user_id NOT IN (${body.results.map(() => "?").join(",")})`
        )
        .all(params.id, ...body.results.map((r) => r.userId)) as { user_id: string }[];
      for (const o of others) {
        db.prepare(
          `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (?, ?, ?, ?, 'tournament', 0, ?)`
        ).run(
          newId("ntf"), o.user_id, "Results published",
          `${tournament.title} has wrapped. Check the points table on the tournament page.`, nowIso()
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
