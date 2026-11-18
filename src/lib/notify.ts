import { newId, nowIso, type DbLike } from "@/db";

/** In-app notification to one or many users. */
export async function notifyUsers(
  db: DbLike,
  userIds: string[],
  title: string,
  body: string,
  kind: string
): Promise<void> {
  for (const uid of userIds) {
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`
      )
      .run(newId("ntf"), uid, title, body, kind, nowIso());
  }
}

/** In-app notification to every admin/organizer (support pings, reset requests…). */
export async function notifyAdmins(db: DbLike, title: string, body: string, kind: string): Promise<void> {
  const admins = await db
    .prepare("SELECT id FROM users WHERE role IN ('ADMIN','ORGANIZER')")
    .all<{ id: string }>();
  await notifyUsers(db, admins.map((a) => a.id), title, body, kind);
}
