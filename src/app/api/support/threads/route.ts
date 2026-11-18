import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { supportThreadSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Logged-in user: open a support thread with a first message. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Log in to contact support.", 401);
    const body = supportThreadSchema.parse(await req.json());
    const db = getDb();

    const threadId = newId("sth");
    const now = nowIso();
    await db.transaction(async (tx) => {
      await tx
        .prepare(
          `INSERT INTO support_threads (id, user_id, subject, status, created_at, updated_at)
           VALUES (?, ?, ?, 'OPEN', ?, ?)`
        )
        .run(threadId, session.sub, body.subject, now, now);
      await tx
        .prepare(
          `INSERT INTO support_messages (id, thread_id, sender_id, sender_role, body, created_at)
           VALUES (?, ?, ?, 'PLAYER', ?, ?)`
        )
        .run(newId("smsg"), threadId, session.sub, body.message, now);
      await notifyAdmins(tx, "New support request", `${session.username}: ${body.subject}`, "support");
    });

    return NextResponse.json({ ok: true, threadId });
  } catch (err) {
    return handleRouteError(err);
  }
}
