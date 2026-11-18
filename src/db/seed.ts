/**
 * KMR eSports — database seed CLI.
 * Idempotent: only seeds when the users table is empty.
 * Run with: npm run db:seed
 */
import { getDb } from "./index";
import { seedCore } from "./seed-core";

const db = getDb();
const count = (db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c;
if (count > 0) {
  console.log("Database already seeded — skipping.");
  process.exit(0);
}

seedCore(db);

console.log("✔ Seeded KMR eSports database");
console.log(`  Admin login: ${process.env.ADMIN_EMAIL ?? "admin@kmr.gg"} / ${process.env.ADMIN_PASSWORD ?? "Admin@123"}`);
console.log("  Players sign up via /register");
