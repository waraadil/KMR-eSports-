import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { supportMessageSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { notifyAdmins, notifyUsers } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Thread owner or admin/organizer: post a reply. Notifies the other side. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Log in to reply.", 401);
    const body = supportMessageSchema.parse(await req.json());
    const db = getDb();

    const thread = await db
      .prepare("SELECT user_id, subject, status FROM support_threads WHERE id = ?")
      .get<{ user_id: string; subject: string; status: string }>(params.id);
    if (!thread) return jsonError("Thread not found.", 404);

    const isStaff = session.role === "ADMIN" || session.role === "ORGANIZER";
    if (!isStaff && thread.user_id !== session.sub) return jsonError("Not your thread.", 403);
    if (thread.status === "CLOSED") return jsonError("This thread is closed — open a new one instead.", 409);

    const now = nowIso();
    await db.transaction(async (tx) => {
      await tx
        .prepare(
          `INSERT INTO support_messages (id, thread_id, sender_id, sender_role, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(newId("smsg"), params.id, session.sub, isStaff ? "ADMIN" : "PLAYER", body.body, now);
      await tx.prepare("UPDATE support_threads SET updated_at = ? WHERE id = ?").run(now, params.id);

      if (isStaff) {
        await notifyUsers(tx, [thread.user_id], "Support replied", `Re: ${thread.subject}`, "support");
      } else {
        await notifyAdmins(tx, "Support reply", `${session.username} replied: ${thread.subject}`, "support");
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
