"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDot, Loader2, Plus, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, initialOf } from "@/lib/format";

export type SupportThreadLite = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  updated_at: string;
  username?: string;
  message_count: number;
};

export type SupportMessageRow = {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
  username: string;
  avatar_color: string;
};

export default function SupportInbox({
  viewer,
  threads,
  activeThread,
  messages,
}: {
  viewer: "player" | "admin";
  threads: SupportThreadLite[];
  activeThread: SupportThreadLite | null;
  messages: SupportMessageRow[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Light polling so both sides see replies without a manual refresh.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeThread?.id]);

  function openThread(id: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("t", id);
    router.push(`?${params.toString()}`);
  }

  async function createThread() {
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: firstMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open thread");
      setNewOpen(false);
      setSubject("");
      setFirstMessage("");
      openThread(data.threadId);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not open thread");
    } finally {
      setBusy(false);
    }
  }

  async function reply() {
    if (!activeThread) return;
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch(`/api/support/threads/${activeThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setBody("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "OPEN" | "CLOSED") {
    if (!activeThread) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/support/threads/${activeThread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* -------- thread list -------- */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <p className="font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            {viewer === "admin" ? "All threads" : "Your threads"}
          </p>
          {viewer === "player" && (
            <button
              onClick={() => setNewOpen((v) => !v)}
              className="grid h-7 w-7 place-items-center rounded-full text-accent transition-colors hover:bg-white/[0.06]"
              aria-label="New support request"
            >
              <Plus size={15} />
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {threads.length === 0 && (
            <p className="px-5 py-6 text-[13px] text-zinc-500">
              {viewer === "admin" ? "No support threads yet." : "No requests yet — hit + to open one."}
            </p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={cn(
                "block w-full border-b border-white/[0.04] px-5 py-4 text-left transition-colors hover:bg-white/[0.03]",
                activeThread?.id === t.id && "bg-white/[0.04]"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold text-white">{t.subject}</span>
                {t.status === "OPEN" ? (
                  <CircleDot size={13} className="shrink-0 text-accent" />
                ) : (
                  <CheckCircle2 size={13} className="shrink-0 text-zinc-600" />
                )}
              </span>
              <span className="mt-1 block text-[11px] text-zinc-500">
                {viewer === "admin" && t.username ? `${t.username} · ` : ""}
                {t.message_count} message{t.message_count === 1 ? "" : "s"} · {formatDateTime(t.updated_at)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* -------- conversation / new thread -------- */}
      <div className="card min-w-0 p-6">
        {newOpen && viewer === "player" ? (
          <div className="space-y-4">
            <h3 className="font-display text-[15px] font-bold text-white">New support request</h3>
            <input
              className="input"
              placeholder="Subject — e.g. Payment deducted but slot not confirmed"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
            />
            <textarea
              className="input min-h-[120px] resize-y"
              placeholder="Describe what's happening — include your username, tournament name, and any payment ID you have."
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              maxLength={2000}
            />
            <button
              onClick={createThread}
              disabled={busy}
              className="btn-accent inline-flex items-center gap-2 rounded-full px-7 py-3 font-tech text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send to support
            </button>
          </div>
        ) : !activeThread ? (
          <p className="py-10 text-center text-[13.5px] text-zinc-500">
            {viewer === "admin"
              ? "Pick a thread on the left to view the conversation."
              : "Pick a thread on the left, or hit + to start a new one."}
          </p>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
              <div>
                <h3 className="font-display text-[15px] font-bold text-white">{activeThread.subject}</h3>
                <p className="mt-0.5 font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  {viewer === "admin" && activeThread.username ? `${activeThread.username} · ` : ""}
                  {activeThread.status}
                </p>
              </div>
              {viewer === "admin" && (
                <button
                  onClick={() => setStatus(activeThread.status === "OPEN" ? "CLOSED" : "OPEN")}
                  disabled={busy}
                  className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 font-tech text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-300 disabled:opacity-60"
                >
                  <XCircle size={12} />
                  {activeThread.status === "OPEN" ? "Close thread" : "Reopen thread"}
                </button>
              )}
            </div>

            <div className="max-h-[380px] space-y-4 overflow-y-auto py-5">
              {messages.map((m) => {
                const mine =
                  (viewer === "admin" && m.sender_role !== "PLAYER") ||
                  (viewer === "player" && m.sender_role === "PLAYER");
                return (
                  <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                      style={{ background: m.avatar_color }}
                    >
                      {initialOf(m.username)}
                    </span>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-3",
                        mine ? "rounded-tr-sm bg-accent-soft" : "rounded-tl-sm bg-white/[0.05]"
                      )}
                    >
                      <p className="text-[13.5px] leading-relaxed text-zinc-200">{m.body}</p>
                      <p className="mt-1.5 font-tech text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">
                        {m.sender_role !== "PLAYER" ? "Support" : m.username} · {formatDateTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {activeThread.status === "OPEN" ? (
              <div className="flex items-end gap-3 border-t border-white/[0.07] pt-4">
                <textarea
                  className="input min-h-[52px] flex-1 resize-y"
                  placeholder="Type your reply…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                />
                <button
                  onClick={reply}
                  disabled={busy || !body.trim()}
                  className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 font-tech text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
                >
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send
                </button>
              </div>
            ) : (
              <p className="border-t border-white/[0.07] pt-4 text-center text-[12.5px] text-zinc-500">
                This thread is closed{viewer === "player" ? " — open a new request if you still need help." : "."}
              </p>
            )}
          </div>
        )}
        {msg && <p className="mt-3 text-[12.5px] font-medium text-red-400">{msg}</p>}
      </div>
    </div>
  );
}
