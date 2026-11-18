"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";

export type ResetRequestRow = {
  user_id: string;
  username: string;
  email: string;
  requested_via: string;
  created_at: string;
};

export default function ResetsPanel({ requests }: { requests: ResetRequestRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<{ userId: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");

  async function act(userId: string, action: "generate" | "resolve") {
    setBusy(userId + action);
    setMsg("");
    setLink(null);
    try {
      const res = await fetch("/api/admin/resets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (action === "generate") {
        setLink({ userId, url: data.link });
      } else {
        router.refresh();
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMsg("Copy failed — select the link and copy it manually.");
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
        <KeyRound size={17} className="text-accent" /> Password reset requests
      </h2>
      <p className="mt-2 text-[13px] text-zinc-500">
        Verify the player (WhatsApp/Discord/in-game), then generate a one-time 30-minute link and
        send it to them. The link is shown once — copy it before navigating away.
      </p>
      <div className="mt-5 space-y-3">
        {requests.map((r) => (
          <div key={r.user_id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-semibold text-white">{r.username}</p>
                <p className="text-[12px] text-zinc-500">{r.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => act(r.user_id, "generate")}
                  disabled={busy !== null}
                  className="btn-accent inline-flex items-center gap-2 rounded-full px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
                >
                  {busy === r.user_id + "generate" ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                  Generate link
                </button>
                <button
                  onClick={() => act(r.user_id, "resolve")}
                  disabled={busy !== null}
                  className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-300 disabled:opacity-60"
                >
                  {busy === r.user_id + "resolve" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Resolve
                </button>
              </div>
            </div>
            {link?.userId === r.user_id && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft/40 px-3 py-2.5">
                <code className="min-w-0 flex-1 truncate font-tech text-[11.5px] text-accent">{link.url}</code>
                <button
                  onClick={() => copy(link.url)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-accent transition-colors hover:bg-white/[0.08]"
                  aria-label="Copy reset link"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && <p className="mt-3 text-[12.5px] font-medium text-red-400">{msg}</p>}
    </div>
  );
}
