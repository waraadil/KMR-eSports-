"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Trash2, Trophy } from "lucide-react";
import type { MatchResultRow, RegistrationRow } from "@/db/queries";

export type MatchRow = {
  id: string;
  round: string;
  label: string;
  status: string;
  scheduled_at: string | null;
};

export default function MatchManager({
  tournamentId,
  matches,
  registrations,
  resultsByMatch,
  completed,
}: {
  tournamentId: string;
  matches: MatchRow[];
  registrations: RegistrationRow[];
  resultsByMatch: Record<string, MatchResultRow[]>;
  completed: boolean;
}) {
  const router = useRouter();
  const [round, setRound] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function addMatch() {
    setMsg("");
    if (round.trim().length < 1 || label.trim().length < 2) {
      setMsg("Give the match a round and a label (e.g. Day 1 · Map 2 — Miramar).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round: round.trim(), label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add match");
      setRound("");
      setLabel("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to add match");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMatch(matchId: string) {
    if (!window.confirm("Delete this match and all its scores? Standings will be recalculated.")) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete match");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to delete match");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (
      !window.confirm(
        "Publish FINAL standings and pay prizes from the aggregate points? This locks the tournament."
      )
    )
      return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/finalize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Finalize failed");
      setMsg("Final standings published — prizes paid, players notified.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!completed && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Round
            </label>
            <input
              className="input !py-2.5 text-[13px]"
              placeholder="Day 1"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Match label
            </label>
            <input
              className="input !py-2.5 text-[13px]"
              placeholder="Map 2 — Miramar"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
            />
          </div>
          <button
            onClick={addMatch}
            disabled={busy}
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 font-tech text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <CalendarPlus size={13} />}
            Add match
          </button>
        </div>
      )}

      <div className="mt-6 space-y-8">
        {matches.map((m) => (
          <MatchScoreForm
            key={m.id}
            tournamentId={tournamentId}
            match={m}
            registrations={registrations}
            existing={resultsByMatch[m.id] ?? []}
            locked={completed}
            onDelete={completed ? undefined : () => deleteMatch(m.id)}
          />
        ))}
        {matches.length === 0 && (
          <p className="text-[13px] text-zinc-500">
            No matches yet — add maps above to score each one separately and build the aggregate
            points table.
          </p>
        )}
      </div>

      {!completed && matches.length > 0 && (
        <button
          onClick={finalize}
          disabled={busy}
          className="btn-accent mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
          Finalize standings &amp; pay prizes
        </button>
      )}
      {msg && <p className="mt-4 text-[13px] font-medium text-zinc-400">{msg}</p>}
    </div>
  );
}

function MatchScoreForm({
  tournamentId,
  match,
  registrations,
  existing,
  locked,
  onDelete,
}: {
  tournamentId: string;
  match: MatchRow;
  registrations: RegistrationRow[];
  existing: MatchResultRow[];
  locked: boolean;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState(() =>
    registrations.map((r) => {
      const ex = existing.find((x) => x.user_id === r.user_id);
      return {
        userId: r.user_id,
        ign: r.ign,
        username: r.username ?? "",
        placement: ex?.placement?.toString() ?? "",
        kills: ex?.kills?.toString() ?? "",
      };
    })
  );

  const scored = existing.length > 0;

  async function save() {
    setMsg("");
    const results = rows
      .filter((r) => r.placement.trim() !== "" || (r.kills.trim() !== "" && parseInt(r.kills, 10) > 0))
      .map((r) => ({
        userId: r.userId,
        placement: r.placement.trim() === "" ? null : parseInt(r.placement, 10),
        kills: r.kills.trim() === "" ? 0 : parseInt(r.kills, 10),
      }));
    if (!results.length) {
      setMsg("Score at least one player (placement or finishes).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMsg("Saved — aggregate standings updated.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-white">{match.label}</p>
          <p className="font-tech text-[10.5px] uppercase tracking-[0.16em] text-zinc-500">
            {match.round} · {scored ? "scored" : match.status.toLowerCase()}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-red-400"
            aria-label="Delete match"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {registrations.length === 0 ? (
        <p className="mt-4 text-[13px] text-zinc-500">No confirmed registrations to score.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-white/[0.07] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <th className="py-2.5 pr-4 font-semibold">Player</th>
                <th className="py-2.5 pr-4 font-semibold">Team</th>
                <th className="w-28 py-2.5 pr-4 font-semibold">Placement</th>
                <th className="w-24 py-2.5 font-semibold">Finishes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.userId} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4 text-[13px] font-medium text-white">{r.ign}</td>
                  <td className="py-2.5 pr-4 text-[12px] text-zinc-500">{r.username}</td>
                  <td className="py-2.5 pr-4">
                    <input
                      className="input !px-3 !py-2 text-center"
                      type="number"
                      min={1}
                      disabled={locked}
                      value={r.placement}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x, j) => (j === i ? { ...x, placement: e.target.value } : x)))
                      }
                      placeholder="#"
                    />
                  </td>
                  <td className="py-2.5">
                    <input
                      className="input !px-3 !py-2 text-center"
                      type="number"
                      min={0}
                      disabled={locked}
                      value={r.kills}
                      onChange={(e) =>
                        setRows((rs) => rs.map((x, j) => (j === i ? { ...x, kills: e.target.value } : x)))
                      }
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!locked && registrations.length > 0 && (
        <button
          onClick={save}
          disabled={busy}
          className="btn-ghost mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Trophy size={13} />}
          {scored ? "Update scores" : "Save scores"}
        </button>
      )}
      {msg && <p className="mt-3 text-[12px] font-medium text-zinc-400">{msg}</p>}
    </div>
  );
}
