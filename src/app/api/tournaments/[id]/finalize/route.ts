import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

type PrizeSlice = { place: string; amount: number };
const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

/**
 * Admin: finalize a multi-match tournament. Ranks players by aggregate
 * points (tiebreak: finishes, then placement points), writes final
 * placements, pays the prize breakdown (+ MVP to most finishes), notifies
 * everyone, and locks the tournament to COMPLETED.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const db = getDb();

    const tournament = await db
      .prepare("SELECT id, title, status, prize_breakdown FROM tournaments WHERE id = ?")
      .get<{ id: string; title: string; status: string; prize_breakdown: string }>(params.id);
    if (!tournament) return jsonError("Tournament not found.", 404);
    if (tournament.status === "COMPLETED") {
      return jsonError("Results already published for this tournament.", 409);
    }

    const standings = await db
      .prepare(
        `SELECT user_id, total_points, kill_points, placement_points, kills
         FROM leaderboard_entries
         WHERE tournament_id = ?
         ORDER BY total_points DESC, kill_points DESC, placement_points DESC`
      )
      .all<{ user_id: string; total_points: number; kill_points: number; placement_points: number; kills: number }>(
        params.id
      );
    if (standings.length === 0) {
      return jsonError("No match results yet — score at least one map first.", 400);
    }

    const breakdown = JSON.parse(tournament.prize_breakdown || "[]") as PrizeSlice[];
    const mvpSlice = breakdown.find((b) => b.place.toUpperCase() === "MVP");
    const mvpId = mvpSlice
      ? [...standings].sort((a, b) => b.kills - a.kills || b.total_points - a.total_points)[0]?.user_id
      : null;

    await db.transaction(async (tx) => {
      for (const [i, s] of standings.entries()) {
        const rank = i + 1;
        const prize =
          (breakdown.find((b) => b.place === ordinal(rank))?.amount ?? 0) +
          (mvpSlice && s.user_id === mvpId ? mvpSlice.amount : 0);

        await tx
          .prepare(
            "UPDATE leaderboard_entries SET placement = ?, prize_won = ? WHERE tournament_id = ? AND user_id = ?"
          )
          .run(rank, prize, params.id, s.user_id);
        await tx
          .prepare(
            "UPDATE registrations SET placement = ?, kills = ? WHERE tournament_id = ? AND user_id = ?"
          )
          .run(rank, s.kills, params.id, s.user_id);

        if (prize > 0) {
          await tx.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(prize, s.user_id);
          await tx
            .prepare(
              `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at) VALUES (?, ?, ?, 'PRIZE_CREDIT', ?, ?)`
            )
            .run(newId("wtx"), s.user_id, prize, `${ordinal(rank)} place — ${tournament.title}`, nowIso());
          await tx
            .prepare(
              `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (?, ?, ?, ?, 'prize', 0, ?)`
            )
            .run(
              newId("ntf"), s.user_id, "Prize credited",
              `${formatINR(prize)} from ${tournament.title} hit your KMR wallet. GG!`, nowIso()
            );
        }
      }

      await tx.prepare("UPDATE tournaments SET status = 'COMPLETED', ends_at = ? WHERE id = ?").run(nowIso(), params.id);

      const others = await tx
        .prepare(
          `SELECT user_id FROM registrations WHERE tournament_id = ? AND status = 'CONFIRMED'
           AND user_id NOT IN (${standings.map(() => "?").join(",")})`
        )
        .all<{ user_id: string }>(params.id, ...standings.map((s) => s.user_id));
      for (const o of others) {
        await tx
          .prepare(
            `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (?, ?, ?, ?, 'tournament', 0, ?)`
          )
          .run(
            newId("ntf"), o.user_id, "Results published",
            `${tournament.title} has wrapped. Check the final points table on the tournament page.`, nowIso()
          );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
