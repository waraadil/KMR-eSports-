import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { recomputeTournamentStandings } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/** Admin: remove a match (and its results), then rebuild the points table. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const db = getDb();
    const t = await db.prepare("SELECT status FROM tournaments WHERE id = ?").get<{ status: string }>(params.id);
    if (!t) return jsonError("Tournament not found.", 404);
    if (t.status === "COMPLETED") return jsonError("Tournament is completed — results are locked.", 409);

    await db.transaction(async (tx) => {
      await tx.prepare("DELETE FROM match_results WHERE match_id = ?").run(params.matchId);
      await tx
        .prepare("DELETE FROM matches WHERE id = ? AND tournament_id = ?")
        .run(params.matchId, params.id);
      await recomputeTournamentStandings(tx, params.id);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
