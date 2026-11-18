import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Crosshair, Flame, Gamepad2, Radio, Swords, Target, Trophy,
} from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal, { Stagger, StaggerItem } from "@/components/motion/Reveal";
import StatusBadge from "@/components/tournaments/StatusBadge";
import WalletCard from "@/components/dashboard/WalletCard";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/db/queries";
import { formatDateTime, formatINR, initialOf } from "@/lib/format";
import { tierForPoints } from "@/lib/points";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const data = await getDashboardData(user.id);
  const tier = tierForPoints(data.totals.points);

  const active = data.registrations.find((r) => r.status === "LIVE");
  const upcoming = data.registrations.filter((r) => r.status === "UPCOMING");
  const kdRatio = data.totals.matches > 0 ? (data.totals.kills / data.totals.matches).toFixed(1) : "0.0";

  const statCards = [
    { label: "Season points", value: String(data.totals.points), icon: Flame },
    { label: "Tournament wins", value: String(data.totals.wins), icon: Trophy },
    { label: "Total finishes", value: String(data.totals.kills), icon: Crosshair },
    { label: "Avg finishes / match", value: kdRatio, icon: Target },
  ];

  return (
    <PageShell theme="theme-sky">
      <Section className="pt-36 md:pt-40">
        {/* header */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl font-display text-xl font-bold text-void-950"
                style={{ background: user.avatar_color }}
              >
                {initialOf(user.username)}
              </span>
              <div>
                <p className="font-tech text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  Player command centre
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                  GG, {user.username}
                </h1>
              </div>
              <span
                className="ml-2 hidden rounded-full px-3.5 py-1.5 font-tech text-[10px] font-bold uppercase tracking-[0.16em] sm:block"
                style={{ color: tier.color, background: `${tier.color}1a` }}
              >
                {tier.name}
              </span>
            </div>
            <Link
              href="/tournaments"
              className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em]"
            >
              <Swords size={15} /> Join a tournament
            </Link>
          </div>
        </Reveal>

        {/* stat cards */}
        <Stagger className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4" step={0.06}>
          {statCards.map((s) => (
            <StaggerItem key={s.label}>
              <div className="card card-hover p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
                  <s.icon size={16} />
                </span>
                <p className="mt-4 font-display text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ---------------- main column ---------------- */}
          <div className="min-w-0 space-y-6">
            {active && (
              <Reveal>
                <Link
                  href={`/tournaments/${active.slug}`}
                  className="card card-hover group relative block overflow-hidden"
                >
                  <div className="absolute inset-0">
                    <Image src={active.game_cover} alt={active.game_name} fill className="object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-void-950/95 via-void-950/75 to-void-950/35" />
                  </div>
                  <div className="relative flex flex-wrap items-center justify-between gap-6 p-7">
                    <div>
                      <StatusBadge status="LIVE" />
                      <h3 className="mt-3 font-display text-xl font-bold text-white">{active.title}</h3>
                      <p className="mt-1.5 text-[13px] text-zinc-400">
                        Your lobby is running — room details are on the tournament page.
                      </p>
                    </div>
                    <span className="btn-accent flex items-center gap-2 rounded-full px-6 py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em]">
                      Enter lobby <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )}

            {/* upcoming matches */}
            <Reveal className="card p-7">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                <Radio size={17} className="text-accent" /> Your match schedule
              </h2>
              {data.matches.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {data.matches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/tournaments/${m.slug}`}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            m.status === "LIVE" ? "bg-red-500 animate-live-dot" : "bg-accent"
                          )}
                        />
                        <div>
                          <p className="text-[13.5px] font-semibold text-white">{m.label}</p>
                          <p className="font-tech text-[10.5px] uppercase tracking-[0.14em] text-zinc-500">
                            {m.title}
                          </p>
                        </div>
                      </div>
                      <span className="font-tech text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                        {m.status === "LIVE" ? (
                          <span className="font-bold text-red-400">Live</span>
                        ) : (
                          formatDateTime(m.scheduled_at)
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-[13.5px] text-zinc-500">
                  No upcoming matches — register for a tournament to fill your schedule.
                </p>
              )}
            </Reveal>

            {/* my tournaments */}
            <Reveal className="card p-7">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                  <Gamepad2 size={17} className="text-accent" /> My tournaments
                </h2>
                <span className="font-tech text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  {data.registrations.length} total
                </span>
              </div>
              {data.registrations.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {data.registrations.map((r) => (
                    <Link
                      key={r.id}
                      href={`/tournaments/${r.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/20"
                    >
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image src={r.game_cover} alt={r.game_name} fill className="object-cover" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-white">{r.title}</p>
                        <p className="mt-0.5 font-tech text-[10.5px] uppercase tracking-[0.14em] text-zinc-500">
                          {formatDateTime(r.starts_at)} · {r.entry_fee === 0 ? "Free entry" : formatINR(r.entry_fee)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusBadge status={r.status} />
                        {r.placement && (
                          <p className="mt-1.5 font-tech text-[10px] uppercase tracking-[0.14em] text-accent">
                            Placed #{r.placement}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-[13.5px] text-zinc-500">No registrations yet.</p>
                  <Link
                    href="/tournaments"
                    className="btn-accent mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-tech text-[11px] font-bold uppercase tracking-[0.16em]"
                  >
                    Browse open lobbies <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </Reveal>

            {/* results history */}
            {data.entries.length > 0 && (
              <Reveal className="card p-7">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                  <Trophy size={17} className="text-accent" /> Result history
                </h2>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        <th className="pb-3 pr-4 font-semibold">Tournament</th>
                        <th className="pb-3 pr-4 text-center font-semibold">Place</th>
                        <th className="pb-3 pr-4 text-center font-semibold">Finishes</th>
                        <th className="pb-3 pr-4 text-center font-semibold">Points</th>
                        <th className="pb-3 text-right font-semibold">Won</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((e) => (
                        <tr key={e.tournament_id} className="border-b border-white/[0.04]">
                          <td className="py-3.5 pr-4 text-[13px] font-medium text-zinc-200">{e.title}</td>
                          <td className="py-3.5 pr-4 text-center font-display text-[13px] font-bold text-white">
                            {e.placement ? `#${e.placement}` : "—"}
                          </td>
                          <td className="py-3.5 pr-4 text-center text-[13px] text-zinc-400">{e.kills}</td>
                          <td className="py-3.5 pr-4 text-center font-display text-[13px] font-bold text-accent">
                            {e.total_points}
                          </td>
                          <td className="py-3.5 text-right text-[13px] font-medium text-zinc-300">
                            {e.prize_won > 0 ? formatINR(e.prize_won) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            )}
          </div>

          {/* ---------------- right column ---------------- */}
          <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Reveal delay={0.05}>
              <WalletCard balance={user.wallet_balance} lifetime={data.totals.earnings} />
            </Reveal>

            {upcoming.length > 0 && (
              <Reveal delay={0.1} className="card p-6">
                <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Up next for you
                </p>
                <div className="mt-4 space-y-3">
                  {upcoming.slice(0, 3).map((r) => (
                    <Link key={r.id} href={`/tournaments/${r.slug}`} className="block rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/20">
                      <p className="truncate text-[13px] font-semibold text-white">{r.title}</p>
                      <p className="mt-1 font-tech text-[10.5px] uppercase tracking-[0.14em] text-zinc-500">
                        {formatDateTime(r.starts_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            <Reveal delay={0.14}>
              <NotificationsPanel items={data.notifications} />
            </Reveal>

            {data.transactions.length > 0 && (
              <Reveal delay={0.18} className="card p-6">
                <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Wallet activity
                </p>
                <div className="mt-4 space-y-3">
                  {data.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-zinc-300">{tx.note || tx.type}</p>
                        <p className="font-tech text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                          {tx.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-display text-[13px] font-bold",
                          tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {tx.amount > 0 ? "+" : "−"}{formatINR(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}