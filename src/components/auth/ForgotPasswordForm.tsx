"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordForm({ emailOn }: { emailOn: boolean }) {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck size={24} />
        </span>
        <p className="mt-5 text-[15px] leading-relaxed text-zinc-300">{done}</p>
        {!emailOn && (
          <p className="mt-3 text-[13px] text-zinc-500">
            Fastest route: ping the KMR team on WhatsApp/Discord with your username — an admin will
            verify it&apos;s you and share a reset link.
          </p>
        )}
        <Link
          href="/login"
          className="btn-ghost mt-6 inline-block rounded-full px-8 py-3 font-tech text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-200"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Email or username
        </label>
        <input
          className="input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com or your_gamertag"
          autoComplete="username"
          required
        />
      </div>
      {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-tech text-[12px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        Start recovery
      </button>
      <p className="text-center text-[13px] text-zinc-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
