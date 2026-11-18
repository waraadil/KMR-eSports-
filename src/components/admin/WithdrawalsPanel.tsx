"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { formatINR, formatDateTime } from "@/lib/format";

export type WithdrawalRow = {
  id: string;
  amount: number;
  upi_id: string;
  status: "PENDING" | "PAID" | "REJECTED";
  note: string;
  created_at: string;
  username: string;
  email: string;
};

export default function WithdrawalsPanel({ withdrawals }: { withdrawals: WithdrawalRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function settle(id: string, action: "PAID" | "REJECTED") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (withdrawals.length === 0) {
    return <p className="mt-5 text-[13px] text-zinc-500">No withdrawal requests yet.</p>;
  }

  return (
    <div className="mt-5 space-y-3">
      {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}
      {withdrawals.map((w) => (
        <div
          key={w.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-white">
              {w.username} <span className="font-normal text-zinc-500">· {w.email}</span>
            </p>
            <p className="mt-0.5 font-tech text-[12px] text-accent">{w.upi_id}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{formatDateTime(w.created_at)}</p>
          </div>
          <p className="font-display text-[16px] font-bold text-white">{formatINR(w.amount)}</p>
          {w.status === "PENDING" ? (
            <div className="flex gap-2">
              <button
                onClick={() => settle(w.id, "PAID")}
                disabled={busyId === w.id}
                className="btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
              >
                {busyId === w.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Mark paid
              </button>
              <button
                onClick={() => settle(w.id, "REJECTED")}
                disabled={busyId === w.id}
                className="btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-300 disabled:opacity-60"
              >
                <X size={12} /> Reject + refund
              </button>
            </div>
          ) : (
            <span
              className={`rounded-full px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.14em] ${
                w.status === "PAID" ? "bg-emerald-400/15 text-emerald-300" : "bg-red-500/15 text-red-400"
              }`}
            >
              {w.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
