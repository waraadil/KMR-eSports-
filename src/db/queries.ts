import { getDb, type SqlParam } from "./index";

export type Game = {
  id: string;
  name: string;
  slug: string;
  publisher: string;
  platforms: string;
  cover: string;
  accent: string;
  description: string;
  active: number;
};

export type Tournament = {
  id: string;
  slug: string;
  title: string;
  game_id: string;
  description: string;
  rules: string; // JSON string[]
  format: string;
  mode: string;
  map: string;
  platform: string;
  entry_fee: number;
  prize_pool: number;
  prize_breakdown: string; // JSON {place, amount}[]
  per_kill_reward: number;
  max_slots: number;
  starts_at: string;
  ends_at: string | null;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
  room_id: string | null;
  room_password: string | null;
  stream_url: string | null;
  featured: number;
  created_by: string | null;
  created_at: string;
};

export type TournamentWithMeta = Tournament & {
  game_name: string;
  game_slug: string;
  game_cover: string;
  game_accent: string;
  filled_slots: number;
};

const TOURNAMENT_SELECT = `
  SELECT t.*, g.name AS game_name, g.slug AS game_slug, g.cover AS game_cover, g.accent AS game_accent,
    (SELECT COUNT(*) FROM registrations r WHERE r.tournament_id = t.id AND r.status = 'CONFIRMED') AS filled_slots
  FROM tournaments t
  JOIN games g ON g.id = t.game_id
`;

export function listGames(): Promise<Game[]> {
  return getDb().prepare("SELECT * FROM games WHERE active = 1 ORDER BY name").all<Game>();
}

export function getGameBySlug(slug: string): Promise<Game | undefined> {
  return getDb().prepare("SELECT * FROM games WHERE slug = ?").get<Game>(slug);
}

export function listTournaments(filters?: {
  status?: string;
  game?: string;
  platform?: string;
  fee?: "free" | "paid";
  q?: string;
  limit?: number;
}): Promise<TournamentWithMeta[]> {
  const where: string[] = ["t.status != 'CANCELLED'"];
  const params: SqlParam[] = [];

  if (filters?.status && filters.status !== "ALL") {
    where.push("t.status = ?");
    params.push(filters.status);
  }
  if (filters?.game && filters.game !== "all") {
    where.push("g.slug = ?");
    params.push(filters.game);
  }
  if (filters?.platform && filters.platform !== "all") {
    where.push("t.platform = ?");
    params.push(filters.platform);
  }
  if (filters?.fee === "free") where.push("t.entry_fee = 0");
  if (filters?.fee === "paid") where.push("t.entry_fee > 0");
  if (filters?.q) {
    where.push("(t.title LIKE ? OR g.name LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const orderBy = `ORDER BY CASE t.status WHEN 'LIVE' THEN 0 WHEN 'UPCOMING' THEN 1 ELSE 2 END, t.starts_at ASC`;
  const limit = filters?.limit ? `LIMIT ${Math.min(filters.limit, 50)}` : "";

  return getDb()
    .prepare(`${TOURNAMENT_SELECT} WHERE ${where.join(" AND ")} ${orderBy} ${limit}`)
    .all<TournamentWithMeta>(...params);
}

export function getTournamentBySlug(slug: string): Promise<TournamentWithMeta | undefined> {
  return getDb().prepare(`${TOURNAMENT_SELECT} WHERE t.slug = ?`).get<TournamentWithMeta>(slug);
}

export function getTournamentById(id: string): Promise<TournamentWithMeta | undefined> {
  return getDb().prepare(`${TOURNAMENT_SELECT} WHERE t.id = ?`).get<TournamentWithMeta>(id);
}

export function getFeaturedTournaments(): Promise<TournamentWithMeta[]> {
  return getDb()
    .prepare(
      `${TOURNAMENT_SELECT} WHERE t.featured = 1 AND t.status IN ('UPCOMING','LIVE')
       ORDER BY CASE t.status WHEN 'LIVE' THEN 0 ELSE 1 END, t.starts_at ASC LIMIT 4`
    )
    .all<TournamentWithMeta>();
}

export type RegistrationRow = {
  id: string;
  tournament_id: string;
  user_id: string;
  team_name: string | null;
  ign: string;
  status: string;
  placement: number | null;
  kills: number;
  created_at: string;
  username?: string;
  avatar_color?: string;
};

export function getRegistrationsForTournament(tournamentId: string): Promise<RegistrationRow[]> {
  return getDb()
    .prepare(
      `SELECT r.*, u.username, u.avatar_color FROM registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.tournament_id = ? AND r.status = 'CONFIRMED'
       ORDER BY r.created_at ASC`
    )
    .all<RegistrationRow>(tournamentId);
}

export function getRegistrationFor(
  tournamentId: string,
  userId: string
): Promise<RegistrationRow | undefined> {
  return getDb()
    .prepare(
      "SELECT * FROM registrations WHERE tournament_id = ? AND user_id = ? AND status = 'CONFIRMED'"
    )
    .get<RegistrationRow>(tournamentId, userId);
}

export type MatchRow = {
  id: string;
  tournament_id: string;
  round: string;
  label: string;
  scheduled_at: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  note: string;
};

export function getMatchesForTournament(tournamentId: string): Promise<MatchRow[]> {
  return getDb()
    .prepare(
      `SELECT * FROM matches WHERE tournament_id = ?
       ORDER BY CASE status WHEN 'LIVE' THEN 0 WHEN 'SCHEDULED' THEN 1 ELSE 2 END, scheduled_at ASC`
    )
    .all<MatchRow>(tournamentId);
}

export type LeaderboardRow = {
  user_id: string;
  username: string;
  avatar_color: string;
  matches: number;
  wins: number;
  podiums: number;
  kills: number;
  points: number;
  prize_won: number;
};

export function getLeaderboard(opts?: { gameSlug?: string; limit?: number }): Promise<LeaderboardRow[]> {
  const gameFilter = opts?.gameSlug && opts.gameSlug !== "all" ? "AND g.slug = ?" : "";
  const params: SqlParam[] = [];
  if (gameFilter) params.push(opts!.gameSlug!);
  const limit = Math.min(opts?.limit ?? 50, 100);
  return getDb()
    .prepare(
      `SELECT u.id AS user_id, u.username, u.avatar_color,
              COUNT(e.id) AS matches,
              SUM(CASE WHEN e.placement = 1 THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN e.placement BETWEEN 1 AND 3 THEN 1 ELSE 0 END) AS podiums,
              SUM(e.kills) AS kills,
              SUM(e.total_points) AS points,
              SUM(e.prize_won) AS prize_won
       FROM leaderboard_entries e
       JOIN users u ON u.id = e.user_id
       JOIN tournaments t ON t.id = e.tournament_id
       JOIN games g ON g.id = t.game_id
       WHERE 1=1 ${gameFilter}
       GROUP BY u.id
       ORDER BY points DESC, wins DESC, kills DESC
       LIMIT ${limit}`
    )
    .all<LeaderboardRow>(...params);
}

export type StandingRow = {
  user_id: string;
  username: string;
  avatar_color: string;
  ign: string;
  team_name: string | null;
  placement: number | null;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  prize_won: number;
};

export function getTournamentStandings(tournamentId: string): Promise<StandingRow[]> {
  return getDb()
    .prepare(
      `SELECT u.id AS user_id, u.username, u.avatar_color, r.ign, r.team_name,
              e.placement, e.kills, e.placement_points, e.kill_points, e.total_points, e.prize_won
       FROM leaderboard_entries e
       JOIN users u ON u.id = e.user_id
       JOIN registrations r ON r.tournament_id = e.tournament_id AND r.user_id = e.user_id
       WHERE e.tournament_id = ?
       ORDER BY e.total_points DESC, e.kills DESC`
    )
    .all<StandingRow>(tournamentId);
}

export type MatchResultRow = {
  match_id: string;
  user_id: string;
  placement: number | null;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  username: string;
  ign: string | null;
  avatar_color: string;
};

export function getTournamentMatchResults(tournamentId: string): Promise<MatchResultRow[]> {
  return getDb()
    .prepare(
      `SELECT mr.match_id, mr.user_id, mr.placement, mr.kills,
              mr.placement_points, mr.kill_points, mr.total_points,
              u.username, u.avatar_color, r.ign
       FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
       JOIN users u ON u.id = mr.user_id
       LEFT JOIN registrations r ON r.tournament_id = m.tournament_id AND r.user_id = mr.user_id
       WHERE m.tournament_id = ?
       ORDER BY mr.total_points DESC, mr.kills DESC`
    )
    .all<MatchResultRow>(tournamentId);
}

export type DashboardData = {
  registrations: (RegistrationRow & {
    title: string;
    slug: string;
    starts_at: string;
    status: Tournament["status"];
    game_name: string;
    game_cover: string;
    game_accent: string;
    prize_pool: number;
    entry_fee: number;
  })[];
  matches: (MatchRow & { title: string; slug: string; game_accent: string })[];
  entries: {
    tournament_id: string;
    title: string;
    placement: number | null;
    kills: number;
    total_points: number;
    prize_won: number;
  }[];
  transactions: { id: string; amount: number; type: string; note: string; created_at: string }[];
  notifications: { id: string; title: string; body: string; kind: string; read: number; created_at: string }[];
  totals: { points: number; wins: number; kills: number; matches: number; earnings: number };
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const db = getDb();
  const [registrations, matches, entries, transactions, notifications, totals] = await Promise.all([
    db
      .prepare(
        `SELECT r.*, t.title, t.slug, t.starts_at, t.status, t.prize_pool, t.entry_fee,
                g.name AS game_name, g.cover AS game_cover, g.accent AS game_accent
         FROM registrations r
         JOIN tournaments t ON t.id = r.tournament_id
         JOIN games g ON g.id = t.game_id
         WHERE r.user_id = ? AND r.status = 'CONFIRMED'
         ORDER BY CASE t.status WHEN 'LIVE' THEN 0 WHEN 'UPCOMING' THEN 1 ELSE 2 END, t.starts_at ASC`
      )
      .all(userId),
    db
      .prepare(
        `SELECT m.*, t.title, t.slug, g.accent AS game_accent
         FROM matches m
         JOIN tournaments t ON t.id = m.tournament_id
         JOIN games g ON g.id = t.game_id
         JOIN registrations r ON r.tournament_id = t.id AND r.user_id = ? AND r.status = 'CONFIRMED'
         WHERE m.status IN ('SCHEDULED','LIVE')
         ORDER BY CASE m.status WHEN 'LIVE' THEN 0 ELSE 1 END, m.scheduled_at ASC
         LIMIT 8`
      )
      .all(userId),
    db
      .prepare(
        `SELECT e.tournament_id, t.title, e.placement, e.kills, e.total_points, e.prize_won
         FROM leaderboard_entries e JOIN tournaments t ON t.id = e.tournament_id
         WHERE e.user_id = ? ORDER BY e.created_at DESC LIMIT 12`
      )
      .all(userId),
    db
      .prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 8")
      .all(userId),
    db
      .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
      .all(userId),
    db
      .prepare(
        `SELECT COALESCE(SUM(total_points),0) AS points,
                COALESCE(SUM(CASE WHEN placement = 1 THEN 1 ELSE 0 END),0) AS wins,
                COALESCE(SUM(kills),0) AS kills,
                COUNT(*) AS matches,
                COALESCE(SUM(prize_won),0) AS earnings
         FROM leaderboard_entries WHERE user_id = ?`
      )
      .get(userId),
  ]);

  return {
    registrations,
    matches,
    entries,
    transactions,
    notifications,
    totals: totals as DashboardData["totals"],
  } as DashboardData;
}

export type AdminOverview = {
  players: number;
  tournaments: number;
  live: number;
  registrations: number;
  gmv: number;
  paidOut: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = getDb();
  const [players, tournaments, live, registrations, gmv, paidOut] = await Promise.all([
    db.prepare("SELECT COUNT(*) c FROM users").get<{ c: number }>(),
    db.prepare("SELECT COUNT(*) c FROM tournaments").get<{ c: number }>(),
    db.prepare("SELECT COUNT(*) c FROM tournaments WHERE status='LIVE'").get<{ c: number }>(),
    db.prepare("SELECT COUNT(*) c FROM registrations WHERE status='CONFIRMED'").get<{ c: number }>(),
    db.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='PAID'").get<{ s: number }>(),
    db
      .prepare("SELECT COALESCE(SUM(amount),0) s FROM wallet_transactions WHERE type='PRIZE_CREDIT'")
      .get<{ s: number }>(),
  ]);
  return {
    players: players!.c,
    tournaments: tournaments!.c,
    live: live!.c,
    registrations: registrations!.c,
    gmv: gmv!.s,
    paidOut: paidOut!.s,
  };
}

export function getRecentWinners(limit = 6): Promise<
  {
    username: string;
    avatar_color: string;
    prize_won: number;
    placement: number;
    title: string;
    game_name: string;
    accent: string;
  }[]
> {
  return getDb()
    .prepare(
      `SELECT u.username, u.avatar_color, e.prize_won, e.placement, t.title, g.name AS game_name, g.accent
       FROM leaderboard_entries e
       JOIN users u ON u.id = e.user_id
       JOIN tournaments t ON t.id = e.tournament_id
       JOIN games g ON g.id = t.game_id
       WHERE e.prize_won > 0
       ORDER BY e.created_at DESC
       LIMIT ?`
    )
    .all(limit);
}

export async function getPlatformStats(): Promise<{
  players: number;
  tournaments: number;
  prize: number;
  matches: number;
}> {
  const db = getDb();
  const [players, tournaments, prize, matches] = await Promise.all([
    db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'PLAYER'").get<{ c: number }>(),
    db.prepare("SELECT COUNT(*) c FROM tournaments").get<{ c: number }>(),
    db
      .prepare("SELECT COALESCE(SUM(prize_pool),0) s FROM tournaments WHERE status != 'CANCELLED'")
      .get<{ s: number }>(),
    db.prepare("SELECT COUNT(*) c FROM matches").get<{ c: number }>(),
  ]);
  return { players: players!.c, tournaments: tournaments!.c, prize: prize!.s, matches: matches!.c };
}
