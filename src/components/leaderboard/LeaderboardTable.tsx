"use client";

import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import type { LeaderboardRow } from "@/db/queries";
import { formatINR, initialOf } from "@/lib/format";
import { tierForPoints } from "@/lib/points";
import { cn } from "@/lib/utils";

function PodiumCard({ row, rank }: { row: LeaderboardRow; rank: 1 | 2 | 3 }) {
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" } as const;
  const medals = { 1: "text-yellow-400", 2: "text-zinc-300", 3: "text-amber-600" } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center", rank === 1 && "sm:-mt-6")}
    >
      <div className="relative mb-4">
        {rank === 1 && <Crown size={22} className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400" />}
        <span
          className={cn(
            "grid place-items-center rounded-full font-display font-bold text-void-950 ring-4 ring-offset-2 ring-offset-void-950",
            rank === 1 ? "h-20 w-20 text-2xl ring-yellow-400/60" : "h-16 w-16 text-lg ring-white/10"
          )}
          style={{ background: row.avatar_color }}
        >
          {initialOf(row.username)}
        </span>
      </div>
      <p className="font-display text-[14px] font-bold text-white">{row.username}</p>
      <p className="mt-0.5 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {row.wins} wins · {row.kills} finishes
      </p>
      <p className="mt-2 font-display text-xl font-bold text-accent">{row.points} pts</p>
      <div
        className={cn(
          "mt-4 flex w-full items-start justify-center rounded-t-2xl border-x border-t border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent pt-3",
          heights[rank]
        )}
      >
        <Medal size={20} className={medals[rank]} />
      </div>
    </motion.div>
  );
}

export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const [first, second, third, ...rest] = rows;

  return (
    <div>
      {/* podium */}
      {rows.length >= 3 && (
        <div className="mx-auto mb-4 grid max-w-2xl grid-cols-3 items-end gap-4 sm:gap-8">
          <PodiumCard row={second} rank={2} />
          <PodiumCard row={first} rank={1} />
          <PodiumCard row={third} rank={3} />
        </div>
      )}

      {/* table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-white/[0.07] font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-4 py-4 font-semibold">Player</th>
                <th className="px-4 py-4 font-semibold">Tier</th>
                <th className="px-4 py-4 text-center font-semibold">Matches</th>
                <th className="px-4 py-4 text-center font-semibold">Wins</th>
                <th className="px-4 py-4 text-center font-semibold">Finishes</th>
                <th className="px-4 py-4 text-right font-semibold">Winnings</th>
                <th className="px-6 py-4 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {(rows.length >= 3 ? rest : rows).map((r, i) => {
                const rank = rows.length >= 3 ? i + 4 : i + 1;
                const tier = tierForPoints(r.points);
                return (
                  <motion.tr
                    key={r.user_id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.045, duration: 0.45, ease: "easeOut" }}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4 font-display text-[13px] font-bold text-zinc-500">
                      {String(rank).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                          style={{ background: r.avatar_color }}
                        >
                          {initialOf(r.username)}
                        </span>
                        <span className="text-[13.5px] font-semibold text-white">{r.username}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="rounded-full px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: tier.color, background: `${tier.color}1a` }}
                      >
                        {tier.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-[13px] text-zinc-400">{r.matches}</td>
                    <td className="px-4 py-4 text-center text-[13px] text-zinc-300">{r.wins}</td>
                    <td className="px-4 py-4 text-center text-[13px] text-zinc-400">{r.kills}</td>
                    <td className="px-4 py-4 text-right text-[13px] font-medium text-zinc-300">
                      {r.prize_won > 0 ? formatINR(r.prize_won) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-display text-[15px] font-bold text-accent">
                      {r.points}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
