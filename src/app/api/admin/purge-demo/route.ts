import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api";
import { getRawClient } from "@/db";
import { purgeDemoData } from "@/db/seed-core";

export const dynamic = "force-dynamic";

/** Admin: force-remove any pre-production demo content from the database. */
export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return jsonError("Admin access required.", 403);
    }
    const client = await getRawClient();
    const result = await purgeDemoData(client, { force: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleRouteError(err);
  }
}
