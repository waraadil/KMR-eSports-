import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

/** Admin/organizer: close or reopen a support thread. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
      return jsonError("Organizer access required.", 403);
    }
    const body = statusSchema.parse(await req.json());
    const db = getDb();

    const result = await db
      .prepare("UPDATE support_threads SET status = ? WHERE id = ?")
      .run(body.status, params.id);
    if (result.changes === 0) return jsonError("Thread not found.", 404);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
