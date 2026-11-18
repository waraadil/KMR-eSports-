"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

const OAUTH_ERRORS: Record<string, string> = {
  google_off: "Google sign-in isn't enabled yet — use email.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "Sign-in security check failed — try again.",
  google_failed: "Google sign-in failed — try again.",
};

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function GoogleButton({ next }: { next?: string }) {
  return (
    <>
      <a
        href={`/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        className="btn-ghost flex w-full items-center justify-center gap-3 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-100"
      >
        <GoogleG /> Continue with Google
      </a>
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-zinc-600">
          or with email
        </span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>
    </>
  );
}

export function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const params = useSearchParams();
  const rawNext = params.get("next") || "/dashboard";
  // Only allow same-origin paths — never an external URL.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const urlError = params.get("error");
  useEffect(() => {
    if (urlError) setError(OAUTH_ERRORS[urlError] ?? "Sign-in failed — try again.");
  }, [urlError]);

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
      // Hard navigation: guarantees the fresh session cookie is sent and avoids
      // the router.push + refresh race that could leave the form spinning.
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {googleEnabled && <GoogleButton next={next} />}
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
        <div className="mb-2 flex items-center justify-between">
          <label className="block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="font-tech text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-accent"
          >
            Forgot password?
          </Link>
        </div>
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
    </form>
  );
}

export function RegisterForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
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
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {googleEnabled && <GoogleButton />}
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
