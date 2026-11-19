"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

/**
 * Permanently delete a tournament and everything attached to it
 * (registrations, matches, scores, leaderboard rows, payments).
 * `redirectTo` — where to go after deleting from the manage page.
 */
export default function DeleteTournamentButton({
  tournamentId,
  title,
  redirectTo,
  compact = false,
}: {
  tournamentId: string;
  title: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (
      !window.confirm(
        `Delete "${title}" permanently?\n\nThis removes the tournament with all its registrations, matches, scores and payments. Already-paid-out winnings stay in player wallets. This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={run}
        disabled={busy}
        className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
        aria-label={`Delete ${title}`}
        title={`Delete ${title}`}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-3 font-tech text-[11px] font-bold uppercase tracking-[0.16em] text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-60"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        Delete tournament
      </button>
      {msg && <p className="text-[12px] font-medium text-red-400">{msg}</p>}
    </div>
  );
}
