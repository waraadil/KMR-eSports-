import { getDb, newId, nowIso } from "@/db";
import type { TournamentWithMeta } from "@/db/queries";

export class RegistrationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Creates a confirmed registration inside a serialised transaction.
 * Re-validates slot availability at write time so two concurrent payments
 * can never overbook a lobby.
 */
export function completeRegistration(opts: {
  tournament: TournamentWithMeta;
  userId: string;
  username: string;
  ign: string;
  teamName?: string | null;
}): { registrationId: string } {
  const db = getDb();
  const { tournament, userId, ign, teamName } = opts;

  if (tournament.status !== "UPCOMING" && tournament.status !== "LIVE") {
    throw new RegistrationError("This tournament is no longer accepting registrations.", 409);
  }

  return db.transaction(() => {
    const existing = db
      .prepare(
        "SELECT id FROM registrations WHERE tournament_id = ? AND user_id = ? AND status = 'CONFIRMED'"
      )
      .get(tournament.id, userId);
    if (existing) throw new RegistrationError("You already have a slot in this tournament.", 409);

    const filled = (
      db
        .prepare(
          "SELECT COUNT(*) c FROM registrations WHERE tournament_id = ? AND status = 'CONFIRMED'"
        )
        .get(tournament.id) as { c: number }
    ).c;
    if (filled >= tournament.max_slots) {
      throw new RegistrationError("Lobby is full — all slots are taken.", 409);
    }

    const id = newId("reg");
    db.prepare(
      `INSERT INTO registrations (id, tournament_id, user_id, team_name, ign, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)`
    ).run(id, tournament.id, userId, teamName || null, ign, nowIso());

    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
       VALUES (?, ?, ?, ?, 'tournament', 0, ?)`
    ).run(
      newId("ntf"),
      userId,
      `You're in — ${tournament.title}`,
      tournament.status === "LIVE"
        ? "The lobby is live. Room details are on the tournament page — get in now!"
        : "Slot locked. Room ID & password appear on the tournament page 15 minutes before start.",
      nowIso()
    );

    return { registrationId: id };
  });
}
