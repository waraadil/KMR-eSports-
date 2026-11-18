import { newId, nowIso, type DbLike } from "@/db";
import { CURRENT_SEASON } from "./points";

/**
 * Rebuild a tournament's aggregate points table from its per-match results.
 * Runs after every match-result save, so the public standings update live as
 * maps complete. Aggregate rows carry placement=NULL and prize_won=0 until
 * finalize assigns final ranks and prize money.
 */
export async function recomputeTournamentStandings(
  db: DbLike,
  tournamentId: string
): Promise<void> {
  const agg = await db
    .prepare(
      `SELECT mr.user_id,
              SUM(mr.placement_points) pp,
              SUM(mr.kill_points)      kp,
              SUM(mr.kills)            kills,
              SUM(mr.total_points)     tp
       FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
       WHERE m.tournament_id = ?
       GROUP BY mr.user_id`
    )
    .all<{ user_id: string; pp: number; kp: number; kills: number; tp: number }>(tournamentId);

  for (const a of agg) {
    await db
      .prepare(
        `INSERT INTO leaderboard_entries
           (id, user_id, tournament_id, season, placement, kills, placement_points, kill_points, bonus_points, total_points, prize_won, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, 0, ?)
         ON CONFLICT (user_id, tournament_id)
         DO UPDATE SET kills = excluded.kills,
           placement_points = excluded.placement_points,
           kill_points = excluded.kill_points,
           total_points = excluded.total_points`
      )
      .run(newId("lbe"), a.user_id, tournamentId, CURRENT_SEASON, a.kills, a.pp, a.kp, a.tp, nowIso());
  }

  // Players whose results were fully removed should not keep aggregate rows.
  await db
    .prepare(
      `DELETE FROM leaderboard_entries
       WHERE tournament_id = ? AND prize_won = 0 AND placement IS NULL
         AND user_id NOT IN (
           SELECT mr.user_id FROM match_results mr
           JOIN matches m ON m.id = mr.match_id WHERE m.tournament_id = ?
         )`
    )
    .run(tournamentId, tournamentId);
}
