import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Layers, Radio, Trophy, Users } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import ResultsForm from "@/components/admin/ResultsForm";
import MatchManager, { type MatchRow } from "@/components/admin/MatchManager";
import RoomControl from "@/components/admin/RoomControl";
import StatusControl from "@/components/admin/StatusControl";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/db";
import {
  getRegistrationsForTournament,
  getTournamentById,
  getTournamentMatchResults,
  type MatchResultRow,
} from "@/db/queries";
import { formatDateTime, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage tournament" };

export default async function ManageTournamentPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const t = await getTournamentById(params.id);
  if (!t) notFound();
  const registrations = await getRegistrationsForTournament(t.id);
  const completed = t.status === "COMPLETED";
  const matches = await getDb()
    .prepare(
      "SELECT id, round, label, status, scheduled_at FROM matches WHERE tournament_id = ? ORDER BY rowid"
    )
    .all<MatchRow>(t.id);
  const matchResults = await getTournamentMatchResults(t.id);
  const resultsByMatch: Record<string, MatchResultRow[]> = {};
  for (const r of matchResults) {
    (resultsByMatch[r.match_id] ??= []).push(r);
  }

  return (
    <PageShell theme="theme-rose">
      <Section className="pt-36 md:pt-40">
        <Reveal>
          <Link
            href="/admin"
            className="mb-8 inline-flex items-center gap-2 font-tech text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> Control room
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tightest text-white md:text-4xl">
                {t.title}
              </h1>
              <p className="mt-3 font-tech text-[12px] uppercase tracking-[0.18em] text-zinc-500">
                {t.game_name} · {t.format} · {formatDateTime(t.starts_at)} · {t.entry_fee === 0 ? "Free" : formatINR(t.entry_fee)}
              </p>
            </div>
            <StatusControl tournamentId={t.id} current={t.status} />
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Reveal delay={0.06} className="min-w-0 space-y-6">
            <div className="card p-6">
              <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                <Users size={13} className="text-accent" /> Lobby
              </p>
              <p className="mt-3 font-display text-3xl font-bold text-white">
                {t.filled_slots}<span className="text-lg text-zinc-500">/{t.max_slots}</span>
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">confirmed registrations</p>
              <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-5 text-[13px]">
                <div className="flex justify-between"><span className="text-zinc-500">Prize pool</span><span className="font-semibold text-white">{formatINR(t.prize_pool)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="font-semibold text-accent">{t.status}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Room</span><span className="font-tech text-[12px] text-zinc-300">{t.room_id ?? "not set"}</span></div>
              </div>
            </div>
            <div id="room" className="scroll-mt-28">
              <Reveal delay={0.09} className="card p-6">
                <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <Radio size={13} className="text-accent" /> Room &amp; stream
                </p>
              <p className="mt-2 mb-4 text-[12px] text-zinc-500">
                Create the custom room in-game, paste the details here, then publish — registered
                players get notified and see the credentials on the tournament page.
              </p>
              <RoomControl
                tournamentId={t.id}
                initialRoomId={t.room_id}
                initialRoomPassword={t.room_password}
                initialStreamUrl={t.stream_url}
                registrantCount={registrations.length}
                locked={completed}
              />
              </Reveal>
            </div>
            <Link
              href={`/tournaments/${t.slug}`}
              className="btn-ghost block rounded-full py-3.5 text-center font-tech text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300"
            >
              View public page
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="card min-w-0 p-7 md:p-8">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              {completed ? <Trophy size={17} className="text-accent" /> : <ClipboardList size={17} className="text-accent" />}
              {completed ? "Final results" : "Enter results"}
            </h2>
            <p className="mt-2 text-[13px] text-zinc-500">
              {completed
                ? "Results are published and prizes paid. This table is read-only."
                : "Tick the players to score, set placements and finishes. Publishing pays out the prize breakdown instantly and updates the season points table."}
            </p>
            <div className="mt-7">
              <ResultsForm tournamentId={t.id} registrations={registrations} completed={completed} />
            </div>
          </Reveal>

          <Reveal delay={0.14} className="card min-w-0 p-7 md:p-8 lg:col-span-2">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              <Layers size={17} className="text-accent" />
              Match-wise scoring
            </h2>
            <p className="mt-2 text-[13px] text-zinc-500">
              Multi-map events (like a 3-map BGMI final): add each map below, score it after the game,
              and the public points table updates live. When all maps are done, hit{" "}
              <span className="text-zinc-300">Finalize standings</span> to rank everyone by aggregate
              points, pay the prize breakdown, and lock the tournament.
            </p>
            <div className="mt-7">
              <MatchManager
                tournamentId={t.id}
                matches={matches}
                registrations={registrations}
                resultsByMatch={resultsByMatch}
                completed={completed}
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </PageShell>
  );
}
