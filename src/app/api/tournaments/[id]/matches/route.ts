import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { matchCreateSchema } from "@/lib/validators";
import { handleRouteError, jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Admin: add a match/map to a tournament's schedule. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = matchCreateSchema.parse(await req.json());
    const db = getDb();

    const t = await db.prepare("SELECT id, status FROM tournaments WHERE id = ?").get<{ status: string }>(params.id);
    if (!t) return jsonError("Tournament not found.", 404);
    if (t.status === "COMPLETED") return jsonError("Tournament is completed — schedule is locked.", 409);

    const id = newId("mch");
    await db
      .prepare(
        `INSERT INTO matches (id, tournament_id, round, label, scheduled_at, status, note)
         VALUES (?, ?, ?, ?, ?, 'SCHEDULED', '')`
      )
      .run(id, params.id, body.round, body.label, body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null);

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return handleRouteError(err);
  }
}
