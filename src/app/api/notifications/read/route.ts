import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized.", 401);
  await getDb().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(session.sub);
  return NextResponse.json({ ok: true });
}
