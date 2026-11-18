import { NextRequest, NextResponse } from "next/server";
import { getTournamentById } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { completeRegistration } from "@/lib/registration";
import { handleRouteError, jsonError } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  ign: z.string().min(2).max(30),
  teamName: z.string().max(40).optional().nullable(),
});

/** Direct registration for free-entry tournaments (no payment step). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Log in to register.", 401);

    const body = schema.parse(await req.json());
    const tournament = await getTournamentById(params.id);
    if (!tournament) return jsonError("Tournament not found.", 404);
    if (tournament.entry_fee > 0) return jsonError("This tournament requires a paid entry.", 402);

    const { registrationId } = await completeRegistration({
      tournament,
      userId: session.sub,
      username: session.username,
      ign: body.ign,
      teamName: body.teamName,
    });

    return NextResponse.json({ ok: true, registrationId });
  } catch (err) {
    return handleRouteError(err);
  }
}
