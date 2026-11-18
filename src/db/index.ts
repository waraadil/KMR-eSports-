import { DatabaseSync, type StatementSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { DDL } from "./schema";

/**
 * Thin data layer over Node's built-in SQLite (node:sqlite).
 * Exposes the small, familiar prepare/get/all/run + transaction surface and
 * keeps the database file inside the workspace. Swap `DatabaseSync` for any
 * Postgres client later — all queries live in src/db/queries.ts.
 */

const DB_PATH = process.env.DATABASE_PATH?.startsWith("/")
  ? process.env.DATABASE_PATH
  : path.join(process.cwd(), process.env.DATABASE_PATH || "./data/kmr.db");

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

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const inner = new DatabaseSync(DB_PATH);
  inner.exec("PRAGMA journal_mode = WAL;");
  inner.exec("PRAGMA foreign_keys = ON;");
  inner.exec("PRAGMA busy_timeout = 5000;");
  const db = new Db(inner);
  db.exec(DDL);
  _db = db;
  return db;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
