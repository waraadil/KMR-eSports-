"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function PurgeDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/purge-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purge failed");
      setMsg(
        data.tournaments === 0 && data.botUsers === 0
          ? "Already clean — no demo content found."
          : `Removed ${data.tournaments} sample tournaments and ${data.botUsers} bot players.`
      );
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Purge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={busy}
        className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-4 font-tech text-[12px] font-semibold uppercase tracking-[0.16em] text-zinc-200 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        Remove demo content
      </button>
      {msg && <p className="text-[12px] text-zinc-400">{msg}</p>}
    </div>
  );
}
