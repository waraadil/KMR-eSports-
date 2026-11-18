"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password needs at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="text-center text-[14px] text-zinc-400">
        This reset link is missing its token. Open the full link you were sent, or{" "}
        <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
          request a new one
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <ShieldCheck size={24} />
        </span>
        <p className="mt-5 text-[15px] text-zinc-300">Password updated — taking you to login…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          New password
        </label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Confirm password
        </label>
        <input
          className="input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
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
        Set new password
      </button>
    </form>
  );
}
