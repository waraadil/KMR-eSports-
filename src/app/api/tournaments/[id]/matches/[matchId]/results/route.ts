import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { resultsSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { placementPoints, killPoints } from "@/lib/points";
import { recomputeTournamentStandings } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Admin: save one match's results (placement + finishes per player).
 * Upserts — re-saving a map corrects it — then rebuilds the tournament's
 * aggregate points table so standings update live.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = resultsSchema.parse(await req.json());
    const db = getDb();

    const t = await db.prepare("SELECT status FROM tournaments WHERE id = ?").get<{ status: string }>(params.id);
    if (!t) return jsonError("Tournament not found.", 404);
    if (t.status === "COMPLETED") return jsonError("Results are locked — tournament is completed.", 409);

    const match = await db
      .prepare("SELECT id FROM matches WHERE id = ? AND tournament_id = ?")
      .get(params.matchId, params.id);
    if (!match) return jsonError("Match not found.", 404);

    await db.transaction(async (tx) => {
      for (const r of body.results) {
        const pp = placementPoints(r.placement);
        const kp = killPoints(r.kills);
        await tx
          .prepare(
            `INSERT INTO match_results
               (id, match_id, user_id, placement, kills, placement_points, kill_points, total_points, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (match_id, user_id)
             DO UPDATE SET placement = excluded.placement, kills = excluded.kills,
               placement_points = excluded.placement_points, kill_points = excluded.kill_points,
               total_points = excluded.total_points`
          )
          .run(newId("mrs"), params.matchId, r.userId, r.placement, r.kills, pp, kp, pp + kp, nowIso());
      }
      await tx.prepare("UPDATE matches SET status = 'COMPLETED' WHERE id = ?").run(params.matchId);
      await recomputeTournamentStandings(tx, params.id);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
