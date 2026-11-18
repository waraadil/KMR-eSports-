# KMR eSports

A production-grade, full-stack competitive gaming tournament platform — host and play paid & free tournaments across BGMI, Valorant, Free Fire MAX, Call of Duty: Mobile, EA FC and Counter-Strike 2.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![DB](https://img.shields.io/badge/SQLite-node%3Asqlite-blue) ![Payments](https://img.shields.io/badge/Payments-Razorpay-orange)

## Features

- **Tournament engine** — create, feature, and run lobbies with slots, entry fees, room credentials, match schedules and live/upcoming/completed lifecycle.
- **Payments** — Razorpay order + signature-verified checkout (drops into a built-in sandbox gateway with the same lifecycle when keys aren't configured). Escrow-style: slot is granted only after server-side verification; auto-refund state if a lobby fills mid-checkout.
- **Points table & leaderboard** — PMGC-style placement points + 1 pt per finish, aggregated into a season leaderboard with tiers (Rookie → Conqueror), per-game filters, podium view and per-tournament standings.
- **Player dashboard** — wallet with ring chart and UPI withdrawals, match schedule, registrations, result history, notifications.
- **Admin control room** — overview KPIs (GMV, payouts, lobbies), one-click lifecycle controls, tournament creation form, and a results publisher that atomically writes standings, credits prize money and notifies players.
- **Auth** — credentials auth with bcrypt hashing, JWT sessions (httpOnly cookies), route protection via middleware, rate-limited auth endpoints.

## Tech

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 14 (App Router, RSC + route handlers)                 |
| Styling    | Tailwind CSS, custom per-page accent themes, Framer Motion    |
| Database   | SQLite via `node:sqlite` (swap `src/db/queries.ts` for Postgres/Supabase later) |
| Auth       | jose JWT + bcryptjs, httpOnly session cookie                  |
| Payments   | Razorpay REST + Checkout.js, HMAC-SHA256 verification         |
| Fonts      | Unbounded (display), Space Grotesk (UI), Chakra Petch (labels)|

## Getting started

```bash
npm install
npm run db:seed      # creates ./data/kmr.db with demo data
npm run dev
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fwaraadil%2FKMR-eSports-)

1. Click the button (or open **Vercel → Add New → Project → Import** `waraadil/KMR-eSports-`).
2. Vercel auto-detects Next.js — no build settings to change. `npm run build` seeds and bundles the SQLite database into the deployment automatically.
3. Add one environment variable before deploying:
   - `AUTH_SECRET` = any long random string (e.g. `openssl rand -hex 32`)
4. Deploy. Every push to the connected branch auto-deploys afterwards.

**Serverless note:** on Vercel the bundled database is copied to `/tmp` per function instance, so runtime writes (new registrations, results) are ephemeral per-instance. For persistent production data, provision a Supabase Postgres project and swap the data layer (`src/db/queries.ts`) — the schema in `src/db/schema.ts` maps 1:1 to Postgres types.


Demo accounts (seeded):

| Role   | Email         | Password   |
| ------ | ------------- | ---------- |
| Admin  | `admin@kmr.gg` | `Admin@123` |
| Player | `demo@kmr.gg`  | `Demo@1234` |

## Going live with real payments

1. Create a Razorpay account → get **Key ID** and **Key Secret**.
2. Copy `.env.example` to `.env.local` and fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, plus a strong `AUTH_SECRET`.
3. (Optional) Add a webhook in the Razorpay dashboard pointing to `/api/payments/webhook` and set `RAZORPAY_WEBHOOK_SECRET`.
4. Restart — the checkout automatically switches from sandbox to the real gateway.

## Project layout

```
src/
  app/                 # routes: /, /tournaments, /leaderboard, /dashboard, /admin, /login, /register, /api/*
  components/          # site chrome, cards, payment modal, dashboard & admin widgets
  db/                  # schema, connection, queries, seed
  lib/                 # auth, jwt, payments, points system, validators, rate limiting
public/assets/         # generated key art for games, hero and trophy
```
