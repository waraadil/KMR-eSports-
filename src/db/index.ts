import { createClient, type Client, type InStatement, type InValue, type ResultSet } from "@libsql/client";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { DDL } from "./schema";

/**
 * Data layer over libSQL.
 *
 * - Local development: `file:./data/kmr.db` (default, zero config, offline).
 * - Production (Vercel): set DATABASE_URL=libsql://<db>.turso.io and
 *   DATABASE_AUTH_TOKEN — every serverless instance shares ONE persistent
 *   hosted database, so accounts, registrations and payments never vanish
 *   between requests.
 *
 * The public surface mirrors the old sync API (prepare → get/all/run) but is
 * async, plus async transactions with ambient nesting: a `db.transaction()`
 * called inside another transaction joins the ambient one instead of opening
 * a nested BEGIN (which remote drivers reject).
 */

export type SqlParam = null | number | bigint | string | Uint8Array;

const LOCAL_PATH = process.env.DATABASE_PATH?.startsWith("/")
  ? process.env.DATABASE_PATH
  : path.join(process.cwd(), process.env.DATABASE_PATH || "./data/kmr.db");

const DB_URL = process.env.DATABASE_URL || `file:${LOCAL_PATH}`;
const IS_LOCAL_FILE = DB_URL.startsWith("file:");

function normalizeArgs(args: (SqlParam | Record<string, SqlParam>)[]): InValue[] | Record<string, InValue> {
  // A single plain-object argument means named parameters (@id, @email, …).
  if (
    args.length === 1 &&
    typeof args[0] === "object" &&
    args[0] !== null &&
    !Array.isArray(args[0]) &&
    !(args[0] instanceof Uint8Array)
  ) {
    return args[0] as Record<string, InValue>;
  }
  return args as InValue[];
}

class Stmt {
  constructor(
    private execFn: (s: InStatement) => Promise<ResultSet>,
    private sql: string
  ) {}

  async run(...args: (SqlParam | Record<string, SqlParam>)[]) {
    const rs = await this.execFn({ sql: this.sql, args: normalizeArgs(args) });
    return { changes: Number(rs.rowsAffected), lastInsertRowid: rs.lastInsertRowid };
  }

  async get<T = unknown>(...args: (SqlParam | Record<string, SqlParam>)[]): Promise<T | undefined> {
    const rs = await this.execFn({ sql: this.sql, args: normalizeArgs(args) });
    const row = rs.rows[0];
    // spread into a plain object so rows can cross RSC → client boundaries
    return row ? ({ ...(row as object) } as T) : undefined;
  }

  async all<T = unknown>(...args: (SqlParam | Record<string, SqlParam>)[]): Promise<T[]> {
    const rs = await this.execFn({ sql: this.sql, args: normalizeArgs(args) });
    return rs.rows.map((r) => ({ ...(r as object) }) as T);
  }
}

const txStore = new AsyncLocalStorage<Db>();

export class Db {
  constructor(private clientReady: Promise<Client>) {}

  prepare(sql: string): Stmt {
    return new Stmt(async (s) => (await this.clientReady).execute(s), sql);
  }

  /** Execute one or more semicolon-separated statements (DDL, pragmas). */
  async exec(sql: string): Promise<void> {
    await (await this.clientReady).executeMultiple(sql);
  }

  /**
   * Async serialised transaction. Nested calls (inside another transaction's
   * async context) reuse the ambient transaction. In-process transactions are
   * serialised behind a mutex; SQLITE_BUSY from the remote server is retried.
   */
  async transaction<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    const ambient = txStore.getStore();
    if (ambient) return fn(ambient);

    const prev = Db.mutex;
    let release!: () => void;
    Db.mutex = new Promise<void>((r) => (release = r));
    await prev;

    try {
      return await withRetry(async () => {
        const client = await this.clientReady;
        const tx = await client.transaction("write");
        const txDb = new Db(Promise.resolve(tx as unknown as Client));
        try {
          const out = await txStore.run(txDb, () => fn(txDb));
          await tx.commit();
          return out;
        } catch (err) {
          await tx.rollback().catch(() => {});
          throw err;
        }
      });
    } finally {
      release();
    }
  }

  private static mutex: Promise<void> = Promise.resolve();
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!/busy|locked|deadlock/i.test(msg)) throw err;
      await new Promise((r) => setTimeout(r, 60 * 2 ** i + Math.random() * 40));
    }
  }
  throw lastErr;
}

let _init: Promise<Client> | null = null;

function init(): Promise<Client> {
  if (_init) return _init;
  _init = (async () => {
    if (IS_LOCAL_FILE) fs.mkdirSync(path.dirname(LOCAL_PATH), { recursive: true });
    const client = createClient({
      url: DB_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
    await client.executeMultiple(DDL);
    await maybeAutoSeed(new Db(Promise.resolve(client)));
    return client;
  })();
  return _init;
}

async function maybeAutoSeed(db: Db): Promise<void> {
  if (process.env.KMR_AUTOSEED === "0") return;
  const row = await db.prepare("SELECT COUNT(*) c FROM users").get<{ c: number }>();
  if (row && row.c > 0) return;
  try {
    const { seedCore } = await import("./seed-core");
    console.log(`[KMR] empty database (${IS_LOCAL_FILE ? "local file" : "remote"}) — running seed…`);
    await seedCore(db);
    console.log("[KMR] seed complete");
  } catch (err) {
    // Concurrent cold starts may race the seed — unique constraints reject the
    // duplicate run; the winner's data stands.
    console.warn("[KMR] seed skipped (likely seeded concurrently):", (err as Error).message);
  }
}

/** Returns the ambient transaction's Db when inside one, else the shared Db. */
export function getDb(): Db {
  return txStore.getStore() ?? new Db(init());
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
