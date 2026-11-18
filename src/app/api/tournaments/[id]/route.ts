import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
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

    const tournament = await db.prepare("SELECT id, status FROM tournaments WHERE id = ?").get(params.id);
    if (!tournament) return jsonError("Tournament not found.", 404);

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
    if (!sets.length) return jsonError("Nothing to update.", 400);

    await db.prepare(`UPDATE tournaments SET ${sets.join(", ")} WHERE id = ?`).run(...vals, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
