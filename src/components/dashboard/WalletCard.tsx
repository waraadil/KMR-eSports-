"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, IndianRupee, Loader2, Wallet } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function WalletCard({
  balance,
  lifetime,
}: {
  balance: number;
  lifetime: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ring shows how much of lifetime earnings remains in balance
  const pct = lifetime > 0 ? Math.min(1, balance / lifetime) : 0;
  const R = 52;
  const C = 2 * Math.PI * R;

  async function withdraw() {
    if (balance < 10000) {
      setMsg("Minimum withdrawal is ₹100.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaise: balance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");
      setMsg("Withdrawal initiated — check notifications.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ background: "var(--accent-soft)" }}
      />
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <Wallet size={13} className="text-accent" /> KMR wallet
        </p>
        <span className="rounded-full bg-white/[0.05] px-2.5 py-1 font-tech text-[9px] uppercase tracking-[0.16em] text-zinc-500">
          INR
        </span>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative grid h-[120px] w-[120px] shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" />
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <IndianRupee size={22} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-[26px] font-bold leading-tight text-white">
            {formatINR(balance, { decimals: true })}
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Lifetime winnings <span className="font-semibold text-zinc-300">{formatINR(lifetime)}</span>
          </p>
          <button
            onClick={withdraw}
            disabled={busy}
            className="btn-accent mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <ArrowUpRight size={13} />}
            Withdraw to UPI
          </button>
        </div>
      </div>
      {msg && <p className="mt-4 text-[12px] font-medium text-zinc-400">{msg}</p>}
    </div>
  );
}
