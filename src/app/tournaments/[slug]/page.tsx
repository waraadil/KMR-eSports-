import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Gamepad2, ListChecks, MapPin, MonitorSmartphone, Radio, Trophy, Users,
} from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import StatusBadge from "@/components/tournaments/StatusBadge";
import RegisterPanel from "@/components/tournaments/RegisterPanel";
import { getCurrentUser } from "@/lib/auth";
import {
  getMatchesForTournament,
  getRegistrationFor,
  getRegistrationsForTournament,
  getTournamentBySlug,
  getTournamentStandings,
} from "@/db/queries";
import { formatDateTime, formatINR, initialOf, timeUntil } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await getTournamentBySlug(params.slug);
  return { title: t ? t.title : "Tournament" };
}

const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export default async function TournamentDetailPage({ params }: { params: { slug: string } }) {
  const t = await getTournamentBySlug(params.slug);
  if (!t) notFound();

  const [user, registrations, matches, standings] = await Promise.all([
    getCurrentUser(),
    getRegistrationsForTournament(t.id),
    getMatchesForTournament(t.id),
    t.status === "UPCOMING" ? Promise.resolve([]) : getTournamentStandings(t.id),
  ]);
  const myReg = user ? await getRegistrationFor(t.id, user.id) : undefined;

  const prizeBreakdown = JSON.parse(t.prize_breakdown || "[]") as { place: string; amount: number }[];
  const rules = JSON.parse(t.rules || "[]") as string[];
  const fillPct = Math.min(100, Math.round((t.filled_slots / t.max_slots) * 100));
  const showRoom = Boolean(myReg && t.room_id);

  return (
    <PageShell
      theme="theme-custom"
      style={{ "--accent": t.game_accent, "--accent-soft": `${t.game_accent}1f`, "--accent-glow": `${t.game_accent}59`, "--on-accent": "#0a0a12" } as React.CSSProperties}
    >
      {/* banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={t.game_cover} alt={t.game_name} fill priority className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-void-950/60 via-void-950/80 to-void-950" />
          <div className="absolute inset-0 bg-grid opacity-30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-36 md:px-8 md:pt-44">
          <Reveal>
            <Link
              href="/tournaments"
              className="mb-8 inline-flex items-center gap-2 font-tech text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} /> All tournaments
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={t.status} />
              <span
                className="clipped-tag px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.18em] text-void-950"
                style={{ background: t.game_accent }}
              >
                {t.game_name}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-300 backdrop-blur">
                {t.platform}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-300 backdrop-blur">
                {t.format} · {t.mode}
              </span>
            </div>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-tightest text-white md:text-[3.6rem]">
              {t.title}
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-accent" />
                {formatDateTime(t.starts_at)}
                {t.status === "UPCOMING" && (
                  <span className="font-tech text-[11px] uppercase tracking-[0.14em] text-accent">
                    · starts in {timeUntil(t.starts_at)}
                  </span>
                )}
              </span>
              {t.map && (
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-accent" /> {t.map}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Users size={15} className="text-accent" /> {t.filled_slots}/{t.max_slots} slots
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      <Section className="!pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ---------------- main column ---------------- */}
          <div className="space-y-6">
            <Reveal className="card p-7 md:p-8">
              <h2 className="font-display text-lg font-bold text-white">About this tournament</h2>
              <p className="mt-4 text-[14.5px] leading-relaxed text-zinc-400">{t.description}</p>
            </Reveal>

            {standings.length > 0 && (
              <Reveal className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-7 py-5">
                  <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                    <Trophy size={17} className="text-accent" /> Points table
                  </h2>
                  <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {t.status === "LIVE" ? "Provisional standings" : "Final standings"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        <th className="px-7 py-3.5 font-semibold">#</th>
                        <th className="px-4 py-3.5 font-semibold">Player</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Place pts</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Finishes</th>
                        <th className="px-4 py-3.5 text-center font-semibold">Kill pts</th>
                        <th className="px-7 py-3.5 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s, i) => (
                        <tr
                          key={s.user_id}
                          className={cn(
                            "border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]",
                            i === 0 && "bg-accent-soft/60"
                          )}
                        >
                          <td className="px-7 py-3.5 font-display text-[13px] font-bold text-zinc-400">{i + 1}</td>
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-3">
                              <span
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                                style={{ background: s.avatar_color }}
                              >
                                {initialOf(s.username)}
                              </span>
                              <span>
                                <span className="block text-[13.5px] font-semibold text-white">{s.ign}</span>
                                {s.team_name && (
                                  <span className="block text-[11px] text-zinc-500">{s.team_name}</span>
                                )}
                              </span>
                              {s.prize_won > 0 && (
                                <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 font-tech text-[9px] font-bold uppercase tracking-wider text-accent">
                                  {formatINR(s.prize_won)}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-[13px] text-zinc-400">{s.placement_points}</td>
                          <td className="px-4 py-3.5 text-center text-[13px] text-zinc-400">{s.kills}</td>
                          <td className="px-4 py-3.5 text-center text-[13px] text-zinc-400">{s.kill_points}</td>
                          <td className="px-7 py-3.5 text-right font-display text-[14px] font-bold text-accent">
                            {s.total_points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            )}

            {matches.length > 0 && (
              <Reveal className="card p-7 md:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                  <Radio size={17} className="text-accent" /> Match schedule
                </h2>
                <div className="mt-6 space-y-3">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            m.status === "LIVE" ? "bg-red-500 animate-live-dot" : m.status === "COMPLETED" ? "bg-zinc-600" : "bg-accent"
                          )}
                        />
                        <div>
                          <p className="text-[13.5px] font-semibold text-white">{m.label}</p>
                          <p className="font-tech text-[10.5px] uppercase tracking-[0.16em] text-zinc-500">{m.round}</p>
                        </div>
                      </div>
                      <span className="font-tech text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                        {m.status === "LIVE" ? (
                          <span className="font-bold text-red-400">Live now</span>
                        ) : (
                          formatDateTime(m.scheduled_at)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {rules.length > 0 && (
              <Reveal className="card p-7 md:p-8">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                  <ListChecks size={17} className="text-accent" /> Rules &amp; fair play
                </h2>
                <ol className="mt-6 space-y-3.5">
                  {rules.map((r, i) => (
                    <li key={i} className="flex gap-4 text-[13.5px] leading-relaxed text-zinc-400">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent-soft font-tech text-[10px] font-bold text-accent">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}

            <Reveal className="card p-7 md:p-8">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                <Users size={17} className="text-accent" /> Registered players
                <span className="font-tech text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {registrations.length}
                </span>
              </h2>
              {registrations.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {registrations.slice(0, 24).map((r) => (
                    <span
                      key={r.id}
                      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-3.5"
                    >
                      <span
                        className="grid h-6 w-6 place-items-center rounded-full font-display text-[9px] font-bold text-void-950"
                        style={{ background: r.avatar_color }}
                      >
                        {initialOf(r.username ?? "?")}
                      </span>
                      <span className="text-[12.5px] font-medium text-zinc-300">{r.ign}</span>
                    </span>
                  ))}
                  {registrations.length > 24 && (
                    <span className="grid place-items-center rounded-full border border-white/[0.08] px-4 font-tech text-[11px] uppercase tracking-wider text-zinc-500">
                      +{registrations.length - 24} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-[13.5px] text-zinc-500">No registrations yet — be the first in the lobby.</p>
              )}
            </Reveal>
          </div>

          {/* ---------------- sidebar ---------------- */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal className="card p-6">
              <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                <Trophy size={13} className="text-accent" /> Prize pool
              </p>
              <p className="mt-2 font-display text-4xl font-bold tracking-tight text-white">
                {formatINR(t.prize_pool)}
              </p>
              <div className="mt-5 space-y-2.5">
                {prizeBreakdown.map((p, i) => {
                  const maxAmt = Math.max(...prizeBreakdown.map((x) => x.amount));
                  return (
                    <div key={p.place}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="font-tech uppercase tracking-[0.14em] text-zinc-500">{p.place}</span>
                        <span className={cn("font-semibold", i === 0 ? "text-accent" : "text-zinc-300")}>
                          {formatINR(p.amount)}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(8, (p.amount / maxAmt) * 100)}%`, opacity: 1 - i * 0.18 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <RegisterPanel
                tournamentId={t.id}
                slug={t.slug}
                title={t.title}
                entryFee={t.entry_fee}
                isLoggedIn={Boolean(user)}
                alreadyRegistered={Boolean(myReg)}
                isFull={t.filled_slots >= t.max_slots}
                status={t.status}
                roomId={showRoom ? t.room_id : null}
                roomPassword={showRoom ? t.room_password : null}
              />
            </Reveal>

            <Reveal delay={0.14} className="card p-6">
              <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                <MonitorSmartphone size={13} className="text-accent" /> Quick facts
              </p>
              <dl className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Game", t.game_name],
                  ["Format", `${t.format} · ${t.mode}`],
                  ["Platform", t.platform],
                  ...(t.map ? [["Map pool", t.map] as [string, string]] : []),
                  ["Starts", formatDateTime(t.starts_at)],
                  ["Slots", `${t.max_slots} (${fillPct}% filled)`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <dt className="text-zinc-500">{k}</dt>
                    <dd className="text-right font-medium text-zinc-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
