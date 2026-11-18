"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2, ChevronRight, Loader2, Lock, QrCode, CreditCard, ShieldCheck, X, Zap,
} from "lucide-react";
import { formatINR } from "@/lib/format";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

type Step = "idle" | "form" | "gateway" | "verifying" | "success" | "error";

export default function RegisterPanel({
  tournamentId,
  slug,
  title,
  entryFee,
  isLoggedIn,
  alreadyRegistered,
  isFull,
  status,
  roomId,
  roomPassword,
}: {
  tournamentId: string;
  slug: string;
  title: string;
  entryFee: number;
  isLoggedIn: boolean;
  alreadyRegistered: boolean;
  isFull: boolean;
  status: string;
  roomId: string | null;
  roomPassword: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [ign, setIgn] = useState("");
  const [teamName, setTeamName] = useState("");
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const closed = status !== "UPCOMING" && status !== "LIVE";

  async function finalizeVerify(orderId: string, paymentId: string, signature: string) {
    setStep("verifying");
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setStep("success");
      setTimeout(() => router.refresh(), 1200);
    } else {
      setError(data.error || "Verification failed");
      setStep("error");
    }
  }

  async function openRazorpay(order: { orderId: string; amount: number; currency: string; keyId: string }) {
    await new Promise<void>((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load Razorpay checkout"));
      document.body.appendChild(s);
    });

    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "KMR eSports",
      description: title,
      order_id: order.orderId,
      theme: { color: "#d8ff3e", backdrop_color: "rgba(4,4,8,0.85)" },
      handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        finalizeVerify(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature),
      modal: { ondismiss: () => setStep("form") },
    });
    rzp.open();
  }

  async function submit() {
    setError("");
    if (ign.trim().length < 2) {
      setError("Enter your in-game name (IGN).");
      return;
    }
    setBusy(true);
    try {
      if (entryFee === 0) {
        const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ign: ign.trim(), teamName: teamName.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        setStep("success");
        setTimeout(() => router.refresh(), 1200);
        return;
      }

      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, ign: ign.trim(), teamName: teamName.trim() || null }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not create order");

      if (order.mode === "razorpay") {
        await openRazorpay(order);
      } else {
        setOrderId(order.orderId); // hand the same order to the mock gateway sheet
        setStep("gateway");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    } finally {
      setBusy(false);
    }
  }

  async function payMock() {
    setError("");
    setBusy(true);
    try {
      // reuse the order created in submit(); create one only if the sheet was reopened
      let oid = orderId;
      if (!oid) {
        const orderRes = await fetch("/api/payments/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId, ign: ign.trim(), teamName: teamName.trim() || null }),
        });
        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(order.error || "Could not create order");
        oid = order.orderId;
        setOrderId(oid);
      }

      const authRes = await fetch("/api/payments/mock-authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid }),
      });
      const auth = await authRes.json();
      if (!authRes.ok) throw new Error(auth.error || "Authorisation failed");

      await finalizeVerify(oid!, auth.paymentId, auth.signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStep("error");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- CTAs ---------- */
  if (alreadyRegistered) {
    return (
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="font-display text-[14px] font-bold text-white">You&apos;re registered</p>
            <p className="text-[12px] text-zinc-500">Your slot is locked in.</p>
          </div>
        </div>
        {roomId && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 flex items-center gap-1.5 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Lock size={11} /> Room credentials
            </p>
            <div className="flex items-center justify-between font-tech text-sm">
              <span className="text-zinc-400">ID</span>
              <span className="font-bold text-accent">{roomId}</span>
            </div>
            {roomPassword && (
              <div className="mt-1.5 flex items-center justify-between font-tech text-sm">
                <span className="text-zinc-400">Password</span>
                <span className="font-bold text-accent">{roomPassword}</span>
              </div>
            )}
          </div>
        )}
        <Link
          href="/dashboard"
          className="btn-ghost block rounded-full py-3.5 text-center font-tech text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-200"
        >
          Open my dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">Entry fee</p>
          <p className="font-display text-3xl font-bold text-white">
            {entryFee === 0 ? "FREE" : formatINR(entryFee)}
          </p>
        </div>
        {entryFee > 0 && (
          <p className="flex items-center gap-1.5 pb-1 font-tech text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <ShieldCheck size={13} className="text-accent" /> Escrow secured
          </p>
        )}
      </div>

      {!isLoggedIn ? (
        <Link
          href={`/login?next=/tournaments/${slug}`}
          className="btn-accent mt-5 block rounded-full py-4 text-center font-tech text-[13px] font-bold uppercase tracking-[0.16em]"
        >
          Log in to register
        </Link>
      ) : closed ? (
        <button disabled className="mt-5 w-full cursor-not-allowed rounded-full bg-white/[0.07] py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Registrations closed
        </button>
      ) : isFull ? (
        <button disabled className="mt-5 w-full cursor-not-allowed rounded-full bg-white/[0.07] py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Lobby full
        </button>
      ) : (
        <button
          onClick={() => setStep("form")}
          className="btn-accent mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em]"
        >
          <Zap size={15} /> {entryFee === 0 ? "Claim free slot" : "Register & pay"}
        </button>
      )}
      <p className="mt-3.5 text-center text-[11.5px] text-zinc-600">
        Instant confirmation · Room drops 15 min before start
      </p>

      {/* ---------- modal ---------- */}
      <AnimatePresence>
        {(step === "form" || step === "gateway" || step === "verifying" || step === "success" || step === "error") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => !busy && step !== "verifying" && setStep("idle")}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-void-850 shadow-2xl"
            >
              {/* header */}
              <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
                <div>
                  <p className="font-tech text-[10px] uppercase tracking-[0.24em] text-accent">KMR checkout</p>
                  <p className="mt-0.5 line-clamp-1 font-display text-[13px] font-bold text-white">{title}</p>
                </div>
                {step !== "verifying" && (
                  <button onClick={() => setStep("idle")} className="rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="p-6">
                {step === "form" && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        In-game name (IGN) *
                      </label>
                      <input className="input" placeholder="e.g. ShadowStrike" value={ign} onChange={(e) => setIgn(e.target.value)} maxLength={30} />
                    </div>
                    <div>
                      <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Team / clan name <span className="text-zinc-600">(optional)</span>
                      </label>
                      <input className="input" placeholder="e.g. Vortex Esports" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={40} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
                      <span className="font-tech text-[12px] uppercase tracking-[0.14em] text-zinc-400">Total</span>
                      <span className="font-display text-lg font-bold text-accent">{entryFee === 0 ? "FREE" : formatINR(entryFee)}</span>
                    </div>
                    {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}
                    <button
                      onClick={submit}
                      disabled={busy}
                      className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                      {entryFee === 0 ? "Confirm registration" : "Continue to payment"}
                    </button>
                  </div>
                )}

                {step === "gateway" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
                      <span className="font-tech text-[12px] uppercase tracking-[0.14em] text-zinc-400">Payable</span>
                      <span className="font-display text-lg font-bold text-accent">{formatINR(entryFee)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { id: "upi", label: "UPI", icon: QrCode, hint: "GPay / PhonePe / Paytm" },
                          { id: "card", label: "Card", icon: CreditCard, hint: "Visa / MC / RuPay" },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            method === m.id
                              ? "border-accent bg-accent-soft"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25"
                          }`}
                        >
                          <m.icon size={18} className={method === m.id ? "text-accent" : "text-zinc-400"} />
                          <p className="mt-2.5 font-tech text-[13px] font-bold uppercase tracking-wider text-white">{m.label}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">{m.hint}</p>
                        </button>
                      ))}
                    </div>
                    {method === "upi" ? (
                      <input className="input" placeholder="yourname@upi" />
                    ) : (
                      <div className="space-y-3">
                        <input className="input" placeholder="Card number" inputMode="numeric" />
                        <div className="grid grid-cols-2 gap-3">
                          <input className="input" placeholder="MM / YY" />
                          <input className="input" placeholder="CVV" type="password" maxLength={4} />
                        </div>
                      </div>
                    )}
                    {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}
                    <button
                      onClick={payMock}
                      disabled={busy}
                      className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
                      Pay {formatINR(entryFee)}
                    </button>
                    <p className="text-center text-[11px] text-zinc-600">
                      Sandbox gateway — set RAZORPAY_KEY_ID/SECRET to go live. No real money moves here.
                    </p>
                  </div>
                )}

                {step === "verifying" && (
                  <div className="flex flex-col items-center gap-5 py-10">
                    <Loader2 size={34} className="animate-spin text-accent" />
                    <p className="font-tech text-[12px] uppercase tracking-[0.22em] text-zinc-400">
                      Verifying payment…
                    </p>
                  </div>
                )}

                {step === "success" && (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 14 }}
                      className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent"
                    >
                      <CheckCircle2 size={30} />
                    </motion.span>
                    <p className="font-display text-lg font-bold text-white">Slot confirmed</p>
                    <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500">
                      GG! Your registration is locked in. Room credentials will appear on the
                      tournament page and your dashboard before start.
                    </p>
                  </div>
                )}

                {step === "error" && (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-red-400">
                      <X size={28} />
                    </span>
                    <p className="font-display text-lg font-bold text-white">Payment didn&apos;t go through</p>
                    <p className="max-w-xs text-[13px] text-zinc-500">{error || "Your money is safe — nothing was charged."}</p>
                    <button
                      onClick={() => setStep("form")}
                      className="btn-ghost mt-1 rounded-full px-7 py-3 font-tech text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-200"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
