/**
 * KMR eSports — database seed CLI.
 * Idempotent: only seeds when the users table is empty.
 * Seeds the DATABASE_URL target (local file by default, remote Turso when env
 * is set). Run with: npm run db:seed
 */
import { getDb } from "./index";
import { seedCore } from "./seed-core";

async function main() {
  const db = getDb();
  const row = await db.prepare("SELECT COUNT(*) c FROM users").get<{ c: number }>();
  if (row && row.c > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }
  await seedCore(db);
  console.log("✔ Seeded KMR eSports database");
  console.log(`  Admin login: ${process.env.ADMIN_EMAIL ?? "admin@kmr.gg"}`);
  console.log("  (admin password from ADMIN_PASSWORD env, default: Admin@123)");
  console.log("  Players sign up via /register");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
