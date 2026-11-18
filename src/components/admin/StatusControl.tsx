"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const STATUSES = ["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"] as const;

export default function StatusControl({
  tournamentId,
  current,
}: {
  tournamentId: string;
  current: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    if (status === current) return;
    setBusy(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {busy && <Loader2 size={13} className="animate-spin text-zinc-500" />}
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          disabled={busy || s === current}
          title={`Mark ${s.toLowerCase()}`}
          className={`rounded-md px-2.5 py-1 font-tech text-[9px] font-bold uppercase tracking-[0.12em] transition-all ${
            s === current
              ? "bg-accent text-[var(--on-accent)]"
              : "border border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-200"
          }`}
        >
          {s === "UPCOMING" ? "Upc" : s === "COMPLETED" ? "Done" : s === "CANCELLED" ? "X" : s}
        </button>
      ))}
    </div>
  );
}
