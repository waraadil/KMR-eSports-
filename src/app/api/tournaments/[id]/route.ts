import { NextRequest, NextResponse } from "next/server";
import { getDb, newId, nowIso } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
  roomId: z.string().max(80).nullable().optional(),
  roomPassword: z.string().max(80).nullable().optional(),
  streamUrl: z.string().url().max(300).nullable().optional(),
  featured: z.boolean().optional(),
  /** Publish the lobby: notify every confirmed registrant that room details are live. */
  notifyRoom: z.boolean().optional(),
});

/** Admin/organizer: update lifecycle status, room credentials, stream link. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = patchSchema.parse(await req.json());
    const db = getDb();

    const tournament = await db
      .prepare("SELECT id, status, title, room_id FROM tournaments WHERE id = ?")
      .get<{ id: string; status: string; title: string; room_id: string | null }>(params.id);
    if (!tournament) return jsonError("Tournament not found.", 404);

    const effectiveRoomId = body.roomId !== undefined ? body.roomId : tournament.room_id;
    if (body.notifyRoom && !effectiveRoomId) {
      return jsonError("Set a room ID before publishing the lobby.", 400);
    }

    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if (body.status) {
      sets.push("status = ?");
      vals.push(body.status);
    }
    if (body.roomId !== undefined) {
      sets.push("room_id = ?");
      vals.push(body.roomId);
    }
    if (body.roomPassword !== undefined) {
      sets.push("room_password = ?");
      vals.push(body.roomPassword);
    }
    if (body.streamUrl !== undefined) {
      sets.push("stream_url = ?");
      vals.push(body.streamUrl);
    }
    if (body.featured !== undefined) {
      sets.push("featured = ?");
      vals.push(body.featured ? 1 : 0);
    }
    if (!sets.length && !body.notifyRoom) return jsonError("Nothing to update.", 400);

    await db.transaction(async (tx) => {
      if (sets.length) {
        await tx.prepare(`UPDATE tournaments SET ${sets.join(", ")} WHERE id = ?`).run(...vals, params.id);
      }
      if (body.notifyRoom) {
        const regs = await tx
          .prepare("SELECT user_id FROM registrations WHERE tournament_id = ? AND status = 'CONFIRMED'")
          .all<{ user_id: string }>(params.id);
        for (const r of regs) {
          await tx
            .prepare(
              `INSERT INTO notifications (id, user_id, title, body, kind, read, created_at)
               VALUES (?, ?, ?, ?, 'tournament', 0, ?)`
            )
            .run(
              newId("ntf"),
              r.user_id,
              "Lobby is open",
              `${tournament.title} — the room is set. Room ID: ${effectiveRoomId}. Grab the password on the tournament page and join the lobby.`,
              nowIso()
            );
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
