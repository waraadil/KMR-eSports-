"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatINR, initialOf } from "@/lib/format";

type StandingRow = {
  user_id: string;
  username: string;
  avatar_color: string;
  ign: string | null;
  team_name: string | null;
  placement: number | null;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  prize_won: number;
};

type MatchResultRow = {
  match_id: string;
  user_id: string;
  placement: number | null;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  username: string;
  ign: string | null;
  avatar_color: string;
};

type MatchLite = { id: string; label: string };

const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export default function StandingsTabs({
  standings,
  matches,
  resultsByMatch,
}: {
  standings: StandingRow[];
  matches: MatchLite[];
  resultsByMatch: Record<string, MatchResultRow[]>;
}) {
  const [tab, setTab] = useState("overall");
  const showTabs = matches.length > 0;

  return (
    <div>
      {showTabs && (
        <div className="flex gap-2 overflow-x-auto border-b border-white/[0.07] px-5 pt-4">
          <TabBtn active={tab === "overall"} onClick={() => setTab("overall")} label="Overall" />
          {matches.map((m) => (
            <TabBtn key={m.id} active={tab === m.id} onClick={() => setTab(m.id)} label={m.label} />
          ))}
        </div>
      )}

      {tab === "overall" ? (
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
                        {s.team_name && <span className="block text-[11px] text-zinc-500">{s.team_name}</span>}
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
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-white/[0.06] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-7 py-3.5 font-semibold">#</th>
                <th className="px-4 py-3.5 font-semibold">Player</th>
                <th className="px-4 py-3.5 text-center font-semibold">Placement</th>
                <th className="px-4 py-3.5 text-center font-semibold">Finishes</th>
                <th className="px-7 py-3.5 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {(resultsByMatch[tab] ?? []).map((r, i) => (
                <tr
                  key={r.user_id}
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
                        style={{ background: r.avatar_color }}
                      >
                        {initialOf(r.username)}
                      </span>
                      <span className="text-[13.5px] font-semibold text-white">{r.ign ?? r.username}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-[13px] text-zinc-400">
                    {r.placement ? ordinal(r.placement) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-center text-[13px] text-zinc-400">{r.kills}</td>
                  <td className="px-7 py-3.5 text-right font-display text-[14px] font-bold text-accent">
                    {r.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-t-lg px-4 py-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
        active
          ? "bg-white/[0.05] text-accent shadow-[inset_0_-2px_0_0_var(--accent)]"
          : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}
