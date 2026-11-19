/**
 * Seed content for KMR eSports. Shared by the CLI (`npm run db:seed`) and the
 * serverless cold-start bootstrap on Vercel. Caller guarantees the users
 * table is empty. Runs as one atomic transaction.
 *
 * Production seed = game catalog + admin account ONLY. No demo players, no
 * fake registrations, no sample tournaments — real content is created by
 * admins through /admin and real users register themselves.
 */
import bcrypt from "bcryptjs";
import type { Client, InStatement } from "@libsql/client";
import { newId, nowIso, type DbLike } from "./index";

/**
 * Guarantees at least one ADMIN login exists. Runs on every cold start, so a
 * database whose very first seed was interrupted (or that was created before
 * admin seeding existed) heals itself. Never touches an existing admin.
 */
export async function ensureAdmin(db: DbLike): Promise<void> {
  const hasAdmin = await db.prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").get();
  if (hasAdmin) return;
  const email = (process.env.ADMIN_EMAIL ?? "admin@kmr.gg").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
  const byEmail = await db.prepare("SELECT id FROM users WHERE email = ?").get<{ id: string }>(email);
  if (byEmail) {
    await db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(byEmail.id);
    console.log(`[KMR] promoted ${email} to ADMIN`);
    return;
  }
  await db
    .prepare(
      `INSERT INTO users (id, email, username, password_hash, role, avatar_color, bio, wallet_balance, created_at)
       VALUES (?, ?, ?, ?, 'ADMIN', '#fb7185', 'Tournament operations @ KMR eSports', 0, ?)`
    )
    .run(newId("usr"), email, "KMR_Admin", bcrypt.hashSync(password, 10), nowIso());
  console.log(`[KMR] admin account restored (${email})`);
}

/** Demo tournaments shipped by pre-production seeds. */
const DEMO_TOURNAMENT_SLUGS = [
  "bgmi-winter-clash-championship",
  "valorant-neon-nights-premier",
  "free-fire-booyah-blitz",
  "codm-sniper-only-showdown",
  "ea-fc-ultimate-cup",
  "cs2-aim-gods-arena",
  "bgmi-solo-fpp-rush",
  "valorant-community-clash-4",
  "bgmi-pro-league-s7-grand-finals",
  "codm-domination-derby",
];

/** Demo player accounts all used this mailbox domain. */
const DEMO_USER_EMAIL_LIKE = "%@players.kmr.gg";

/**
 * One-time cleanup for databases that received the old demo seed: removes the
 * sample tournaments (with their registrations, matches, standings and
 * payments) and the bot player accounts. Real user accounts and any
 * admin-created tournaments are untouched. Guarded by a _meta flag so it runs
 * exactly once per database.
 */
export async function purgeDemoData(
  client: Client,
  opts: { force?: boolean } = {}
): Promise<{ tournaments: number; botUsers: number; alreadyDone: boolean; titles: string[] }> {
  await client.execute("CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  if (!opts.force) {
    const done = await client.execute("SELECT value FROM _meta WHERE key = 'demo_purge_v2'");
    if (done.rows.length > 0) return { tournaments: 0, botUsers: 0, alreadyDone: true, titles: [] };
  }

  const stmts: InStatement[] = [];

  // Prefix match: re-seeds and series editions suffix the base slug
  // ("Free Fire Booyah Blitz #12" -> free-fire-booyah-blitz-12) and exact
  // matching silently misses them forever.
  const likeClause = DEMO_TOURNAMENT_SLUGS.map(() => "slug LIKE ?").join(" OR ");
  const tRows = await client.execute({
    sql: `SELECT id, title FROM tournaments WHERE ${likeClause}`,
    args: DEMO_TOURNAMENT_SLUGS.map((s) => `${s}%`),
  });
  const deletedTitles: string[] = [];
  const tIds: string[] = [];
  for (const row of tRows.rows) {
    const id = row.id as string;
    // Safety: never delete a tournament that has registrations from real
    // (non-demo) players, no matter how demo-ish its name looks.
    const real = await client.execute({
      sql: `SELECT COUNT(*) AS n FROM registrations r
            JOIN users u ON u.id = r.user_id
            WHERE r.tournament_id = ? AND u.email NOT LIKE ?`,
      args: [id, DEMO_USER_EMAIL_LIKE],
    });
    if (Number(real.rows[0]?.n ?? 0) === 0) {
      tIds.push(id);
      deletedTitles.push(row.title as string);
    }
  }
  if (tIds.length > 0) {
    const ph = tIds.map(() => "?").join(",");
    // per-map scores hang off matches, not tournaments — remove them first
    stmts.push({
      sql: `DELETE FROM match_results WHERE match_id IN (SELECT id FROM matches WHERE tournament_id IN (${ph}))`,
      args: [...tIds],
    });
    for (const table of ["registrations", "matches", "leaderboard_entries", "payments"]) {
      stmts.push({ sql: `DELETE FROM ${table} WHERE tournament_id IN (${ph})`, args: [...tIds] });
    }
    stmts.push({ sql: `DELETE FROM tournaments WHERE id IN (${ph})`, args: [...tIds] });
  }

  const uRows = await client.execute({
    sql: "SELECT id FROM users WHERE email LIKE ?",
    args: [DEMO_USER_EMAIL_LIKE],
  });
  const uIds = uRows.rows.map((r) => r.id as string);
  if (uIds.length > 0) {
    const ph = uIds.map(() => "?").join(",");
    // FK-safe order: messages before their threads, children before parents.
    // Messages in a bot's thread may have been sent by admins, so match by
    // thread as well as by sender.
    stmts.push({
      sql: `DELETE FROM support_messages WHERE sender_id IN (${ph})
            OR thread_id IN (SELECT id FROM support_threads WHERE user_id IN (${ph}))`,
      args: [...uIds, ...uIds],
    });
    for (const table of [
      "support_threads",
      "registrations",
      "leaderboard_entries",
      "wallet_transactions",
      "notifications",
      "payments",
      "withdrawals",
      "password_resets",
      "match_results",
    ]) {
      stmts.push({ sql: `DELETE FROM ${table} WHERE user_id IN (${ph})`, args: [...uIds] });
    }
    stmts.push({ sql: `DELETE FROM users WHERE id IN (${ph})`, args: [...uIds] });
  }

  stmts.push({
    sql: "INSERT OR REPLACE INTO _meta (key, value) VALUES ('demo_purge_v2', ?)",
    args: [new Date().toISOString()],
  });
  await client.batch(stmts, "write");
  if (tIds.length > 0 || uIds.length > 0) {
    console.log(`[KMR] demo data purged — ${tIds.length} sample tournaments, ${uIds.length} bot players removed`);
  }
  return { tournaments: tIds.length, botUsers: uIds.length, alreadyDone: false, titles: deletedTitles };
}

export async function seedCore(db: DbLike): Promise<void> {
  await db.transaction(async (tx) => {
    // ------------------------------------------------------------- admin ----
    await ensureAdmin(tx);

    // ------------------------------------------------------------- games ----
    const insertGame = (p: Record<string, unknown>) =>
      tx.prepare(
        `INSERT INTO games (id, name, slug, publisher, platforms, cover, accent, description, active)
         VALUES (@id, @name, @slug, @publisher, @platforms, @cover, @accent, @description, 1)`
      ).run(p as never);

    const games = [
      {
        id: "game_bgmi", name: "BGMI", slug: "bgmi", publisher: "KRAFTON",
        platforms: "Mobile", cover: "/assets/games/bgmi.jpg", accent: "#f59e0b",
        description: "India's biggest battle royale. 100 players, one chicken dinner.",
      },
      {
        id: "game_valorant", name: "Valorant", slug: "valorant", publisher: "Riot Games",
        platforms: "PC", cover: "/assets/games/valorant.jpg", accent: "#fb7185",
        description: "5v5 tactical shooter where precise gunplay meets agent abilities.",
      },
      {
        id: "game_freefire", name: "Free Fire MAX", slug: "free-fire", publisher: "Garena",
        platforms: "Mobile", cover: "/assets/games/freefire.jpg", accent: "#facc15",
        description: "Fast 10-minute battle royale rounds. Booyah or nothing.",
      },
      {
        id: "game_codm", name: "Call of Duty: Mobile", slug: "codm", publisher: "Activision",
        platforms: "Mobile", cover: "/assets/games/codm.jpg", accent: "#38bdf8",
        description: "Console-grade FPS on mobile. MP ranked, BR and sniper showdowns.",
      },
      {
        id: "game_efootball", name: "EA FC 26", slug: "ea-fc", publisher: "EA Sports",
        platforms: "Console,PC", cover: "/assets/games/efootball.jpg", accent: "#4ade80",
        description: "The beautiful game. 1v1 Ultimate Team knockouts every week.",
      },
      {
        id: "game_cs2", name: "Counter-Strike 2", slug: "cs2", publisher: "Valve",
        platforms: "PC", cover: "/assets/games/cs2.jpg", accent: "#fb923c",
        description: "The definitive tactical FPS. Aim, economy, and nerves of steel.",
      },
    ];
    for (const g of games) await insertGame(g);
  });
}
