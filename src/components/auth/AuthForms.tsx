"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Email or gamertag
        </label>
        <input
          className="input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Password
        </label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium text-red-400">
          {error}
        </motion.p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
        Enter the arena
      </button>
      <p className="text-center text-[13px] text-zinc-500">
        New here?{" "}
        <Link href="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
        <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-600">Demo credentials</p>
        <p className="mt-1.5 font-tech text-[12px] text-zinc-400">
          demo@kmr.gg / Demo@1234 · admin@kmr.gg / Admin@123
        </p>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Gamertag
        </label>
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ShadowStrike"
          maxLength={20}
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Email
        </label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Password
        </label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8+ characters"
          autoComplete="new-password"
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium text-red-400">
          {error}
        </motion.p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
        Create account
      </button>
      <p className="text-center text-[13px] text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
