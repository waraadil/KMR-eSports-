/**
 * Applies the schema (CREATE TABLE IF NOT EXISTS …) to the configured
 * database target and lists the resulting tables.
 */
import { getDb } from "./index";

async function main() {
  const db = getDb();
  const tables = await db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all<{ name: string }>();
  console.log("✔ Database migrated. Tables:");
  for (const t of tables) console.log("  -", t.name);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
