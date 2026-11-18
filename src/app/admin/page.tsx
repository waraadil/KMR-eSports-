import Link from "next/link";
import {
  Activity, CircleDollarSign, Gamepad2, Plus, Radio, Swords, Users, Wallet,
} from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import StatusControl from "@/components/admin/StatusControl";
import PurgeDemoButton from "@/components/admin/PurgeDemoButton";
import WithdrawalsPanel, { type WithdrawalRow } from "@/components/admin/WithdrawalsPanel";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview, listTournaments } from "@/db/queries";
import { formatDateTime, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const [overview, tournaments] = await Promise.all([getAdminOverview(), listTournaments({})]);
  const withdrawals = await getDb()
    .prepare(
      `SELECT w.id, w.amount, w.upi_id, w.status, w.note, w.created_at, w.processed_at,
              u.username, u.email
       FROM withdrawals w JOIN users u ON u.id = w.user_id
       ORDER BY CASE w.status WHEN 'PENDING' THEN 0 ELSE 1 END, w.created_at DESC
       LIMIT 100`
    )
    .all<WithdrawalRow>();
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");

  const cards = [
    { label: "Registered players", value: String(overview.players), icon: Users },
    { label: "Tournaments", value: String(overview.tournaments), icon: Gamepad2 },
    { label: "Live right now", value: String(overview.live), icon: Radio },
    { label: "Total registrations", value: String(overview.registrations), icon: Activity },
    { label: "Entry fees collected", value: formatINR(overview.gmv), icon: CircleDollarSign },
    { label: "Prizes paid out", value: formatINR(overview.paidOut), icon: Wallet },
  ];

  return (
    <PageShell theme="theme-rose">
      <Section className="pt-36 md:pt-40">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-4">Control room</p>
              <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tightest text-white md:text-[3rem]">
                Tournament <span className="text-accent text-glow">ops</span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/tournaments/new"
                className="btn-accent inline-flex items-center gap-2 rounded-full px-7 py-4 font-tech text-[12px] font-bold uppercase tracking-[0.16em]"
              >
                <Plus size={15} /> New tournament
              </Link>
              <PurgeDemoButton />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="card p-5">
                <c.icon size={16} className="text-accent" />
                <p className="mt-4 truncate font-display text-xl font-bold text-white">{c.value}</p>
                <p className="mt-1 font-tech text-[9.5px] uppercase tracking-[0.16em] text-zinc-500">{c.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="card mt-10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-7 py-5">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
                <Swords size={17} className="text-accent" /> All tournaments
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <th className="px-7 py-4 font-semibold">Tournament</th>
                    <th className="px-4 py-4 font-semibold">Game</th>
                    <th className="px-4 py-4 font-semibold">Starts</th>
                    <th className="px-4 py-4 text-center font-semibold">Slots</th>
                    <th className="px-4 py-4 text-right font-semibold">Prize</th>
                    <th className="px-4 py-4 text-right font-semibold">Entry</th>
                    <th className="px-7 py-4 text-right font-semibold">Lifecycle</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                      <td className="px-7 py-4">
                        <Link href={`/admin/tournaments/${t.id}`} className="text-[13.5px] font-semibold text-white hover:text-accent">
                          {t.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-[12.5px] text-zinc-400">{t.game_name}</td>
                      <td className="px-4 py-4 text-[12.5px] text-zinc-400">{formatDateTime(t.starts_at)}</td>
                      <td className="px-4 py-4 text-center text-[12.5px] text-zinc-300">
                        {t.filled_slots}/{t.max_slots}
                      </td>
                      <td className="px-4 py-4 text-right text-[12.5px] font-medium text-zinc-200">
                        {formatINR(t.prize_pool)}
                      </td>
                      <td className="px-4 py-4 text-right text-[12.5px] text-zinc-400">
                        {t.entry_fee === 0 ? "Free" : formatINR(t.entry_fee)}
                      </td>
                      <td className="px-7 py-4">
                        <div className="flex justify-end">
                          <StatusControl tournamentId={t.id} current={t.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* withdrawal settlement queue */}
        <Reveal delay={0.18}>
          <div className="card mt-6 p-7 md:p-8">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
              <Wallet size={17} className="text-accent" /> Withdrawal requests
              {pendingWithdrawals.length > 0 && (
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-tech text-[10px] font-bold uppercase tracking-wider text-accent">
                  {pendingWithdrawals.length} pending
                </span>
              )}
            </h2>
            <p className="mt-2 text-[12.5px] text-zinc-500">
              Pay the player manually to their UPI ID, then mark as paid. Rejecting refunds the
              amount to the player&apos;s KMR wallet automatically.
            </p>
            <WithdrawalsPanel withdrawals={withdrawals} />
          </div>
        </Reveal>
      </Section>
    </PageShell>
  );
}
