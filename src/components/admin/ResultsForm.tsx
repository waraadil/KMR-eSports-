"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import type { RegistrationRow } from "@/db/queries";

export default function ResultsForm({
  tournamentId,
  registrations,
  completed,
}: {
  tournamentId: string;
  registrations: RegistrationRow[];
  completed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState(
    registrations.map((r) => ({
      userId: r.user_id,
      username: r.username ?? "",
      ign: r.ign,
      placement: r.placement?.toString() ?? "",
      kills: r.kills.toString(),
      included: r.placement != null,
    }))
  );

  async function submit() {
    setMsg("");
    const results = rows
      .filter((r) => r.included && r.placement)
      .map((r) => ({
        userId: r.userId,
        placement: parseInt(r.placement, 10),
        kills: parseInt(r.kills || "0", 10),
      }));
    if (!results.length) {
      setMsg("Mark at least one player with a placement.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish results");
      setMsg("Results published — points, prizes and notifications sent.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to publish results");
    } finally {
      setBusy(false);
    }
  }

  if (registrations.length === 0) {
    return <p className="text-[13.5px] text-zinc-500">No confirmed registrations to score.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-white/[0.07] font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <th className="py-3 pr-4 font-semibold">Score</th>
              <th className="py-3 pr-4 font-semibold">Player</th>
              <th className="py-3 pr-4 font-semibold">Team</th>
              <th className="w-28 py-3 pr-4 font-semibold">Placement</th>
              <th className="w-24 py-3 font-semibold">Finishes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className="border-b border-white/[0.04]">
                <td className="py-3 pr-4">
                  <input
                    type="checkbox"
                    disabled={completed}
                    checked={r.included}
                    onChange={(e) =>
                      setRows((rs) => rs.map((x, j) => (j === i ? { ...x, included: e.target.checked } : x)))
                    }
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </td>
                <td className="py-3 pr-4 text-[13px] font-medium text-white">{r.ign}</td>
                <td className="py-3 pr-4 text-[12px] text-zinc-500">{r.username}</td>
                <td className="py-3 pr-4">
                  <input
                    className="input !px-3 !py-2 text-center"
                    type="number"
                    min={1}
                    disabled={completed || !r.included}
                    value={r.placement}
                    onChange={(e) =>
                      setRows((rs) => rs.map((x, j) => (j === i ? { ...x, placement: e.target.value } : x)))
                    }
                    placeholder="#"
                  />
                </td>
                <td className="py-3">
                  <input
                    className="input !px-3 !py-2 text-center"
                    type="number"
                    min={0}
                    disabled={completed || !r.included}
                    value={r.kills}
                    onChange={(e) =>
                      setRows((rs) => rs.map((x, j) => (j === i ? { ...x, kills: e.target.value } : x)))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!completed && (
        <button
          onClick={submit}
          disabled={busy}
          className="btn-accent mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
          Publish results &amp; pay prizes
        </button>
      )}
      {msg && <p className="mt-4 text-[13px] font-medium text-zinc-400">{msg}</p>}
    </div>
  );
}
