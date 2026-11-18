import { getDb } from "./index";

const db = getDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all() as { name: string }[];

console.log("✔ Database migrated. Tables:");
for (const t of tables) console.log("  -", t.name);
