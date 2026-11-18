import { DatabaseSync, type StatementSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { DDL } from "./schema";

/**
 * Thin data layer over Node's built-in SQLite (node:sqlite).
 * Exposes the small, familiar prepare/get/all/run + transaction surface.
 *
 * On Vercel (read-only project filesystem) the seeded database is bundled at
 * build time (see `outputFileTracingIncludes` in next.config.mjs) and copied
 * to /tmp on cold start; if the bundle is missing the DB is seeded in place.
 */

const IS_VERCEL = process.env.VERCEL === "1";

const LOCAL_PATH = process.env.DATABASE_PATH?.startsWith("/")
  ? process.env.DATABASE_PATH
  : path.join(process.cwd(), process.env.DATABASE_PATH || "./data/kmr.db");

const DB_PATH = IS_VERCEL ? "/tmp/kmr.db" : LOCAL_PATH;

export type SqlParam = null | number | bigint | string | Uint8Array;
export type SqlParams = SqlParam[] | Record<string, SqlParam>;

class Stmt {
  constructor(private stmt: StatementSync) {}
  run(...args: (SqlParam | Record<string, SqlParam>)[]) {
    return this.stmt.run(...(args as never[]));
  }
  get<T = unknown>(...args: (SqlParam | Record<string, SqlParam>)[]): T | undefined {
    const row = this.stmt.get(...(args as never[]));
    if (row === undefined || row === null) return undefined;
    // node:sqlite rows have null prototypes — spread into plain objects so they
    // can cross RSC → client component boundaries.
    return { ...(row as object) } as T;
  }
  all<T = unknown>(...args: (SqlParam | Record<string, SqlParam>)[]): T[] {
    const rows = this.stmt.all(...(args as never[]));
    return rows.map((r) => ({ ...(r as object) }) as T);
  }
}

export class Db {
  constructor(private inner: DatabaseSync) {}

  prepare(sql: string): Stmt {
    return new Stmt(this.inner.prepare(sql));
  }

  exec(sql: string): void {
    this.inner.exec(sql);
  }

  /** Synchronous, serialised transaction with savepoint-based nesting. */
  private txDepth = 0;

  transaction<T>(fn: () => T): T {
    if (this.txDepth > 0) {
      const sp = `kmr_sp_${this.txDepth}`;
      this.inner.exec(`SAVEPOINT ${sp}`);
      this.txDepth++;
      try {
        const out = fn();
        this.inner.exec(`RELEASE ${sp}`);
        return out;
      } catch (err) {
        try {
          this.inner.exec(`ROLLBACK TO ${sp}`);
          this.inner.exec(`RELEASE ${sp}`);
        } catch {
          /* outer transaction will roll back */
        }
        throw err;
      } finally {
        this.txDepth--;
      }
    }

    this.inner.exec("BEGIN IMMEDIATE");
    this.txDepth++;
    try {
      const out = fn();
      this.inner.exec("COMMIT");
      return out;
    } catch (err) {
      try {
        this.inner.exec("ROLLBACK");
      } catch {
        /* already rolled back */
      }
      throw err;
    } finally {
      this.txDepth--;
    }
  }
}

/** On Vercel, hydrate the writable /tmp copy from the read-only build bundle. */
function bootstrapDatabase(): void {
  if (fs.existsSync(DB_PATH)) return;
  const bundled = path.join(process.cwd(), "data", "kmr.db");
  try {
    if (fs.existsSync(bundled)) fs.copyFileSync(bundled, DB_PATH);
  } catch (err) {
    console.warn("[KMR] could not copy bundled database, will seed fresh", err);
  }
}

function maybeAutoSeed(db: Db): void {
  if (process.env.KMR_AUTOSEED === "0") return;
  const c = (db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c;
  if (c > 0) return;
  // Lazy require to avoid a load-time circular import (seed-core imports ids from here).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { seedCore } = require("./seed-core") as typeof import("./seed-core");
  console.log("[KMR] empty database — running seed…");
  seedCore(db);
}

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  if (IS_VERCEL) bootstrapDatabase();
  else fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const inner = new DatabaseSync(DB_PATH);
  inner.exec("PRAGMA journal_mode = WAL;");
  inner.exec("PRAGMA foreign_keys = ON;");
  inner.exec("PRAGMA busy_timeout = 5000;");
  const db = new Db(inner);
  db.exec(DDL);
  maybeAutoSeed(db);
  _db = db;
  return db;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
