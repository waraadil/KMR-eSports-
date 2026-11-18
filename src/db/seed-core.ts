/**
 * Seed content for KMR eSports. Shared by the CLI (`npm run db:seed`) and the
 * serverless cold-start bootstrap on Vercel. Caller guarantees the users
 * table is empty. Runs as one atomic transaction.
 */
import bcrypt from "bcryptjs";
import { newId, nowIso, type Db } from "./index";
import { placementPoints, killPoints, CURRENT_SEASON } from "../lib/points";

export async function seedCore(db: Db): Promise<void> {
  await db.transaction(async (tx) => {

const daysFromNow = (d: number, h = 0) =>
  new Date(Date.now() + d * 86400000 + h * 3600000).toISOString();

// ---------------------------------------------------------------- users ----
// Admin credentials come from env so production never ships a shared password.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@kmr.gg";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const playerHash = bcrypt.hashSync(`kmr-player-${Math.random().toString(36).slice(2)}`, 10);

const AVATAR_COLORS = [
  "#d8ff3e", "#fb7185", "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80",
  "#f97316", "#e879f9", "#22d3ee", "#facc15", "#f87171", "#34d399",
];

const insertUser = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO users (id, email, username, password_hash, role, avatar_color, bio, wallet_balance, created_at)
     VALUES (@id, @email, @username, @hash, @role, @color, @bio, 0, @now)`
  ).run(p as never);

const adminId = newId("usr");
await insertUser({
  id: adminId, email: ADMIN_EMAIL, username: "KMR_Admin", hash: adminHash,
  role: "ADMIN", color: "#fb7185", bio: "Tournament operations @ KMR eSports", now: nowIso(),
});

const playerNames = [
  "ReaperX", "NoScopeNina", "ClutchKaran", "PixelPriya", "FragMachine", "ZenithOP",
  "LootGoblin", "ShadowStrike", "BlitzVeer", "ToxicTanu", "HeadshotHero", "GhostRiderGG",
  "VenomVikram", "SilentSniper", "RushB_Ravi", "AimGodAdi", "ByteBandit", "CriticalHit",
  "DeltaForce", "OmegaOP", "NovaNikhil", "PhantomFury", "QuantumQueen", "RogueRider",
  "StormBreaker", "TurboThala", "UltraInstinct", "VortexVed", "WarLordWaqar", "XtremeXena",
];

const playerIds: string[] = [];
for (let i = 0; i < playerNames.length; i++) {
  const id = newId("usr");
  playerIds.push(id);
  await insertUser({
    id,
    email: `${playerNames[i].toLowerCase()}@players.kmr.gg`,
    username: playerNames[i],
    hash: playerHash,
    role: "PLAYER",
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    bio: "",
    now: nowIso(),
  });
}

// ---------------------------------------------------------------- games ----
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

// ----------------------------------------------------------- tournaments ----
type PrizeSlice = { place: string; amount: number };
const insertTournament = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO tournaments (id, slug, title, game_id, description, rules, format, mode, map, platform,
      entry_fee, prize_pool, prize_breakdown, per_kill_reward, max_slots, starts_at, ends_at, status,
      room_id, room_password, stream_url, featured, created_by, created_at)
     VALUES (@id, @slug, @title, @game_id, @description, @rules, @format, @mode, @map, @platform,
      @entry_fee, @prize_pool, @prize_breakdown, @per_kill_reward, @max_slots, @starts_at, @ends_at, @status,
      @room_id, @room_password, @stream_url, @featured, @created_by, @created_at)`
  ).run(p as never);

const STANDARD_RULES = [
  "Room ID & password are shared on your dashboard 15 minutes before start.",
  "Emulators are strictly banned in mobile tournaments — instant disqualification.",
  "Hacking, teaming, or stream-sniping leads to a permanent KMR ban.",
  "Screenshot your final standings screen and keep it for 24 hours.",
  "Points: placement table + 1 point per elimination.",
  "Organiser decisions are final. Be in the lobby 10 minutes early.",
];

const DUEL_RULES = [
  "Single-elimination bracket. Higher seed hosts the lobby.",
  "Report the score with a screenshot within 10 minutes of match end.",
  "No-show after 10 minutes = walkover for the opponent.",
  "Smurfing on a borrowed account leads to disqualification.",
];

function T(partial: Record<string, unknown>) {
  return {
    id: newId("trn"), rules: JSON.stringify(STANDARD_RULES), mode: "TPP", map: "",
    per_kill_reward: 0, ends_at: null, room_id: null, room_password: null,
    stream_url: null, featured: 0, created_by: adminId, created_at: nowIso(),
    ...partial,
  };
}

const tournaments: Record<string, unknown>[] = [
  T({
    slug: "bgmi-winter-clash-championship",
    title: "BGMI Winter Clash Championship",
    game_id: "game_bgmi",
    description:
      "Our flagship squad battleground of the season. 25 squads drop into Erangel across 3 maps — only one lifts the Winter Clash trophy. Casted live with observer feed.",
    format: "Squad", mode: "TPP", map: "Erangel ×3", platform: "Mobile",
    entry_fee: 9900, prize_pool: 1000000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 500000 }, { place: "2nd", amount: 300000 },
      { place: "3rd", amount: 150000 }, { place: "MVP", amount: 50000 },
    ] satisfies PrizeSlice[]),
    per_kill_reward: 0, max_slots: 100,
    starts_at: daysFromNow(2, 5), status: "UPCOMING",
    room_id: "KMR-WC-7741", room_password: "winter99", featured: 1,
  }),
  T({
    slug: "valorant-neon-nights-premier",
    title: "Valorant Neon Nights Premier",
    game_id: "game_valorant",
    description:
      "32 teams. One neon-soaked bracket. Double-elimination on Ascent, Bind and Sunset with a best-of-3 grand final streamed on the KMR channel.",
    rules: JSON.stringify(DUEL_RULES),
    format: "5v5", mode: "Premier", map: "Ascent / Bind / Sunset", platform: "PC",
    entry_fee: 19900, prize_pool: 2500000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 1200000 }, { place: "2nd", amount: 700000 },
      { place: "3rd", amount: 400000 }, { place: "4th", amount: 200000 },
    ] satisfies PrizeSlice[]),
    max_slots: 32, starts_at: daysFromNow(5, 6), status: "UPCOMING", featured: 1,
  }),
  T({
    slug: "free-fire-booyah-blitz",
    title: "Free Fire Booyah Blitz #12",
    game_id: "game_freefire",
    description:
      "48 lone wolves, three rapid Bermuda rounds, one Booyah champion. Our fastest-selling weekly — grab a slot before they're gone.",
    format: "Solo", mode: "BR", map: "Bermuda", platform: "Mobile",
    entry_fee: 4900, prize_pool: 500000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 250000 }, { place: "2nd", amount: 150000 }, { place: "3rd", amount: 100000 },
    ] satisfies PrizeSlice[]),
    max_slots: 48, starts_at: daysFromNow(1, 4), status: "UPCOMING",
  }),
  T({
    slug: "codm-sniper-only-showdown",
    title: "CODM Sniper-Only Showdown",
    game_id: "game_codm",
    description:
      "Lobbies live RIGHT NOW. Snipers only on Standoff and Crossfire — no scopes? No problem. Top frag takes the pot.",
    format: "Solo", mode: "Sniper Only", map: "Standoff / Crossfire", platform: "Mobile",
    entry_fee: 7900, prize_pool: 800000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 400000 }, { place: "2nd", amount: 250000 }, { place: "3rd", amount: 150000 },
    ] satisfies PrizeSlice[]),
    max_slots: 64, starts_at: daysFromNow(0, -3), ends_at: daysFromNow(1), status: "LIVE",
    room_id: "KMR-SN-2210", room_password: "scope5", featured: 1,
  }),
  T({
    slug: "ea-fc-ultimate-cup",
    title: "EA FC 26 Ultimate Cup",
    game_id: "game_efootball",
    description:
      "1v1 Ultimate Team, single-elimination. Cross-play enabled — console and PC welcome. Extra time & pens decide draws.",
    rules: JSON.stringify(DUEL_RULES),
    format: "1v1", mode: "Ultimate Team", map: "", platform: "Console",
    entry_fee: 14900, prize_pool: 1200000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 600000 }, { place: "2nd", amount: 350000 }, { place: "3rd", amount: 250000 },
    ] satisfies PrizeSlice[]),
    max_slots: 32, starts_at: daysFromNow(3, 7), status: "UPCOMING",
  }),
  T({
    slug: "cs2-aim-gods-arena",
    title: "CS2 Aim Gods Arena",
    game_id: "game_cs2",
    description:
      "The server is live. 16 stacks battle through Mirage, Inferno and Nuke in a double-elimination gauntlet for the Aim Gods crown.",
    rules: JSON.stringify(DUEL_RULES),
    format: "5v5", mode: "Double Elimination", map: "Mirage / Inferno / Nuke", platform: "PC",
    entry_fee: 12900, prize_pool: 1500000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 800000 }, { place: "2nd", amount: 450000 }, { place: "3rd", amount: 250000 },
    ] satisfies PrizeSlice[]),
    max_slots: 16, starts_at: daysFromNow(0, -1), ends_at: daysFromNow(1, 2), status: "LIVE",
    room_id: "connect 51.79.44.12:27015", room_password: "aimgods", featured: 1,
  }),
  T({
    slug: "bgmi-solo-fpp-rush",
    title: "BGMI Solo FPP Rush — Free Entry",
    game_id: "game_bgmi",
    description:
      "Zero entry fee, real prize money. Our community starter cup: solo FPP on Livik, perfect first tournament for new grinders.",
    format: "Solo", mode: "FPP", map: "Livik", platform: "Mobile",
    entry_fee: 0, prize_pool: 200000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 120000 }, { place: "2nd", amount: 50000 }, { place: "3rd", amount: 30000 },
    ] satisfies PrizeSlice[]),
    max_slots: 100, starts_at: daysFromNow(1, 8), status: "UPCOMING", featured: 1,
  }),
  T({
    slug: "valorant-community-clash-4",
    title: "Valorant Community Clash #4",
    game_id: "game_valorant",
    description: "Our monthly community stack clash. Completed — GG to everyone who played.",
    rules: JSON.stringify(DUEL_RULES),
    format: "5v5", mode: "Single Elimination", map: "Haven / Split", platform: "PC",
    entry_fee: 9900, prize_pool: 600000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 350000 }, { place: "2nd", amount: 150000 }, { place: "3rd", amount: 100000 },
    ] satisfies PrizeSlice[]),
    max_slots: 16, starts_at: daysFromNow(-7), ends_at: daysFromNow(-6), status: "COMPLETED",
  }),
  T({
    slug: "bgmi-pro-league-s7-grand-finals",
    title: "BGMI Pro League S7 — Grand Finals",
    game_id: "game_bgmi",
    description:
      "The season finale. 16 qualified squads, 6 maps, ₹50,000 on the line. The biggest lobby we have ever hosted.",
    format: "Squad", mode: "TPP", map: "Erangel / Miramar / Sanhok", platform: "Mobile",
    entry_fee: 19900, prize_pool: 5000000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 2500000 }, { place: "2nd", amount: 1200000 },
      { place: "3rd", amount: 700000 }, { place: "MVP", amount: 600000 },
    ] satisfies PrizeSlice[]),
    max_slots: 64, starts_at: daysFromNow(-14), ends_at: daysFromNow(-13), status: "COMPLETED",
  }),
  T({
    slug: "codm-domination-derby",
    title: "CODM Domination Derby",
    game_id: "game_codm",
    description: "5v5 Domination on Nuketown and Shipment. Fast, loud, chaotic — completed.",
    rules: JSON.stringify(DUEL_RULES),
    format: "5v5", mode: "Domination", map: "Nuketown / Shipment", platform: "Mobile",
    entry_fee: 5900, prize_pool: 400000,
    prize_breakdown: JSON.stringify([
      { place: "1st", amount: 220000 }, { place: "2nd", amount: 120000 }, { place: "3rd", amount: 60000 },
    ] satisfies PrizeSlice[]),
    max_slots: 32, starts_at: daysFromNow(-21), ends_at: daysFromNow(-20), status: "COMPLETED",
  }),
];

const tIds: Record<string, string> = {};
for (const t of tournaments) {
  await insertTournament(t);
  tIds[t.slug as string] = t.id as string;
}

// ---------------------------------------------------- registrations etc. ----
const insertReg = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO registrations (id, tournament_id, user_id, team_name, ign, status, placement, kills, created_at)
     VALUES (@id, @tournament_id, @user_id, @team_name, @ign, 'CONFIRMED', @placement, @kills, @created_at)`
  ).run(p as never);
const insertPayment = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO payments (id, order_id, user_id, tournament_id, amount, currency, gateway, gateway_payment_id, signature, status, created_at, paid_at)
     VALUES (@id, @order_id, @user_id, @tournament_id, @amount, 'INR', 'razorpay', @pid, @sig, 'PAID', @created_at, @paid_at)`
  ).run(p as never);
const insertEntry = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO leaderboard_entries (id, user_id, tournament_id, season, placement, kills, placement_points, kill_points, bonus_points, total_points, prize_won, created_at)
     VALUES (@id, @user_id, @tournament_id, @season, @placement, @kills, @pp, @kp, 0, @tp, @prize_won, @created_at)`
  ).run(p as never);
const insertMatch = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO matches (id, tournament_id, round, label, scheduled_at, status, note)
     VALUES (@id, @tournament_id, @round, @label, @scheduled_at, @status, '')`
  ).run(p as never);
const insertWallet = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO wallet_transactions (id, user_id, amount, type, note, created_at) VALUES (@id, @user_id, @amount, @type, @note, @created_at)`
  ).run(p as never);
const insertNotif = (p: Record<string, unknown>) =>
  tx.prepare(
    `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at) VALUES (@id, @user_id, @title, @body, @kind, @read, @created_at)`
  ).run(p as never);
const bumpWallet = (amount: number, userId: string) =>
  tx.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(amount, userId);

let seed = 42;
const srand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

const TEAM_SUFFIX = ["Esports", "Gaming", "Syndicate", "Clan", "Nation", "Rebels", "Titans", "Crew"];
const teamName = (name: string) => `${name} ${TEAM_SUFFIX[Math.floor(srand() * TEAM_SUFFIX.length)]}`;

async function registerUserFor(userId: string, username: string, slug: string, opts: {
  paid: boolean; entryFee: number; team?: boolean; placement?: number | null; kills?: number; daysAgo?: number;
}) {
  const tid = tIds[slug];
  const created = daysFromNow(-(opts.daysAgo ?? 3));
  await insertReg({
    id: newId("reg"), tournament_id: tid, user_id: userId,
    team_name: opts.team ? teamName(username) : null, ign: username,
    placement: opts.placement ?? null, kills: opts.kills ?? 0, created_at: created,
  });
  if (opts.paid && opts.entryFee > 0) {
    await insertPayment({
      id: newId("pay"), order_id: `order_seed_${newId("o").slice(2, 12)}`,
      user_id: userId, tournament_id: tid, amount: opts.entryFee,
      pid: `pay_seed_${newId("p").slice(2, 12)}`, sig: "seed",
      created_at: created, paid_at: created,
    });
  }
  return tid;
}

// completed tournaments → final standings + prizes
async function finalizeTournament(slug: string, participantIds: string[], prizeMap: Record<number, number>, daysAgo: number) {
  const tid = tIds[slug];
  const t = tournaments.find((x) => x.slug === slug)! as { entry_fee: number; title: string; prize_breakdown: string };
  const breakdown = JSON.parse(t.prize_breakdown as string) as PrizeSlice[];
  for (const [i, uid] of participantIds.entries()) {
    const placement = i + 1;
    const kills = Math.floor(srand() * 9);
    const user = (await tx.prepare("SELECT username FROM users WHERE id = ?").get<{ username: string }>(uid))!;
    await registerUserFor(uid, user.username, slug, {
      paid: t.entry_fee > 0, entryFee: t.entry_fee, team: true, placement, kills, daysAgo,
    });
    const prize = prizeMap[placement] ?? 0;
    await insertEntry({
      id: newId("lbe"), user_id: uid, tournament_id: tid, season: CURRENT_SEASON,
      placement, kills, pp: placementPoints(placement), kp: killPoints(kills),
      tp: placementPoints(placement) + killPoints(kills), prize_won: prize, created_at: daysFromNow(-daysAgo),
    });
    await tx.prepare("UPDATE registrations SET placement = ?, kills = ? WHERE tournament_id = ? AND user_id = ?")
      .run(placement, kills, tid, uid);
    if (prize > 0) {
      await bumpWallet(prize, uid);
      await insertWallet({
        id: newId("wtx"), user_id: uid, amount: prize, type: "PRIZE_CREDIT",
        note: `${breakdown.find((b) => b.place === ordinal(placement))?.place ?? ordinal(placement)} place — ${t.title}`,
        created_at: daysFromNow(-daysAgo),
      });
      await insertNotif({
        id: newId("ntf"), user_id: uid, title: "Prize credited",
        body: `₹${(prize / 100).toLocaleString("en-IN")} from ${t.title} hit your KMR wallet. GG!`,
        kind: "prize", read: 0, created_at: daysFromNow(-daysAgo),
      });
    }
  }
}

function ordinal(n: number) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}

// Pro League finals — 16 players, prizes to top 3 + MVP (4th)
await finalizeTournament("bgmi-pro-league-s7-grand-finals", playerIds.slice(0, 16), { 1: 2500000, 2: 1200000, 3: 700000, 4: 600000 }, 14);
// Community Clash — 8 players
await finalizeTournament("valorant-community-clash-4", playerIds.slice(8, 16), { 1: 350000, 2: 150000, 3: 100000 }, 7);
// Domination Derby — 10 players
await finalizeTournament("codm-domination-derby", playerIds.slice(16, 26), { 1: 220000, 2: 120000, 3: 60000 }, 20);

// crowd registrations for live/upcoming tournaments
const crowdTargets: [string, number, boolean][] = [
  ["bgmi-winter-clash-championship", 76, true],
  ["valorant-neon-nights-premier", 21, true],
  ["free-fire-booyah-blitz", 41, false],
  ["codm-sniper-only-showdown", 52, false],
  ["ea-fc-ultimate-cup", 18, false],
  ["cs2-aim-gods-arena", 14, true],
  ["bgmi-solo-fpp-rush", 63, false],
];
const feeBySlug: Record<string, number> = {
  "bgmi-winter-clash-championship": 9900,
  "valorant-neon-nights-premier": 19900,
  "free-fire-booyah-blitz": 4900,
  "codm-sniper-only-showdown": 7900,
  "ea-fc-ultimate-cup": 14900,
  "cs2-aim-gods-arena": 12900,
  "bgmi-solo-fpp-rush": 0,
};
for (const [slug, count, team] of crowdTargets) {
  for (let i = 0; i < count; i++) {
    const uid = playerIds[Math.floor(srand() * playerIds.length)];
    const exists = await tx
      .prepare("SELECT 1 x FROM registrations WHERE tournament_id = ? AND user_id = ?")
      .get(tIds[slug], uid);
    if (exists) continue;
    const user = (await tx.prepare("SELECT username FROM users WHERE id = ?").get<{ username: string }>(uid))!;
    await registerUserFor(uid, user.username, slug, {
      paid: feeBySlug[slug] > 0, entryFee: feeBySlug[slug], team, daysAgo: Math.floor(srand() * 4),
    });
  }
}

// provisional standings for the live CODM tournament (mid-tournament points table)
{
  const tid = tIds["codm-sniper-only-showdown"];
  const regs = await tx
    .prepare("SELECT r.user_id, u.username FROM registrations r JOIN users u ON u.id = r.user_id WHERE r.tournament_id = ? LIMIT 12")
    .all<{ user_id: string; username: string }>(tid);
  for (const [i, r] of regs.entries()) {
    const kills = Math.max(0, 11 - i + Math.floor(srand() * 3));
    const placement = i < 8 ? i + 1 : null;
    await insertEntry({
      id: newId("lbe"), user_id: r.user_id, tournament_id: tid, season: CURRENT_SEASON,
      placement, kills, pp: placementPoints(placement), kp: killPoints(kills),
      tp: placementPoints(placement) + killPoints(kills), prize_won: 0, created_at: daysFromNow(0, -2),
    });
  }
}

// matches schedule for live & upcoming tournaments
async function seedMatches(slug: string, defs: [string, string, number, string][]) {
  for (const [round, label, offsetH, status] of defs) {
    await insertMatch({
      id: newId("mch"), tournament_id: tIds[slug], round, label,
      scheduled_at: daysFromNow(0, offsetH), status,
    });
  }
}
await seedMatches("codm-sniper-only-showdown", [
  ["Round 1", "Lobby A — Standoff", -3, "COMPLETED"],
  ["Round 1", "Lobby B — Crossfire", -2, "COMPLETED"],
  ["Round 2", "Winners Lobby — Standoff", 0, "LIVE"],
  ["Round 3", "Grand Final — Crossfire", 4, "SCHEDULED"],
]);
await seedMatches("cs2-aim-gods-arena", [
  ["Upper Bracket", "UB Semifinal 1 — Mirage", 0, "LIVE"],
  ["Upper Bracket", "UB Semifinal 2 — Inferno", 1, "SCHEDULED"],
  ["Lower Bracket", "LB Round 1 — Nuke", 5, "SCHEDULED"],
]);
await seedMatches("bgmi-winter-clash-championship", [
  ["Day 1", "Map 1 — Erangel", 53, "SCHEDULED"],
  ["Day 1", "Map 2 — Erangel", 54, "SCHEDULED"],
  ["Day 1", "Map 3 — Erangel", 55, "SCHEDULED"],
]);
await seedMatches("valorant-neon-nights-premier", [
  ["Bracket", "Round of 32 — Ascent", 126, "SCHEDULED"],
  ["Bracket", "Round of 16 — Bind", 130, "SCHEDULED"],
]);

  });
}
