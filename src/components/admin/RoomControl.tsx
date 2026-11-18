"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Save } from "lucide-react";

export default function RoomControl({
  tournamentId,
  initialRoomId,
  initialRoomPassword,
  initialStreamUrl,
  registrantCount,
  locked,
}: {
  tournamentId: string;
  initialRoomId: string | null;
  initialRoomPassword: string | null;
  initialStreamUrl: string | null;
  registrantCount: number;
  locked: boolean;
}) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(initialRoomId ?? "");
  const [roomPassword, setRoomPassword] = useState(initialRoomPassword ?? "");
  const [streamUrl, setStreamUrl] = useState(initialStreamUrl ?? "");
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [msg, setMsg] = useState("");

  async function submit(notify: boolean) {
    setMsg("");
    if (notify && !roomId.trim()) {
      setMsg("Set a room ID before publishing the lobby.");
      return;
    }
    if (streamUrl.trim() && !/^https?:\/\/.+/.test(streamUrl.trim())) {
      setMsg("Stream link must start with http:// or https://");
      return;
    }
    if (notify && !window.confirm(`Publish the lobby and notify ${registrantCount} registered player${registrantCount === 1 ? "" : "s"}?`)) {
      return;
    }
    setBusy(notify ? "publish" : "save");
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId.trim() || null,
          roomPassword: roomPassword.trim() || null,
          streamUrl: streamUrl.trim() || null,
          ...(notify ? { notifyRoom: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMsg(
        notify
          ? `Lobby published — ${registrantCount} player${registrantCount === 1 ? "" : "s"} notified.`
          : "Saved. Registered players now see these details on the tournament page."
      );
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Room ID
        </label>
        <input
          className="input !py-2.5 font-tech text-[13px]"
          placeholder="e.g. 58234190"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          maxLength={80}
          disabled={locked}
        />
      </div>
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Room password
        </label>
        <input
          className="input !py-2.5 font-tech text-[13px]"
          placeholder="e.g. kmr123"
          value={roomPassword}
          onChange={(e) => setRoomPassword(e.target.value)}
          maxLength={80}
          disabled={locked}
        />
      </div>
      <div>
        <label className="mb-1.5 block font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Stream link (optional)
        </label>
        <input
          className="input !py-2.5 font-tech text-[13px]"
          placeholder="https://youtube.com/…"
          value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)}
          maxLength={300}
          disabled={locked}
        />
      </div>

      {!locked && (
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => submit(false)}
            disabled={busy !== null}
            className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full py-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:opacity-60"
          >
            {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save quietly
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy !== null}
            className="btn-accent inline-flex items-center justify-center gap-2 rounded-full py-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-60"
          >
            {busy === "publish" ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />}
            Publish &amp; notify players
          </button>
        </div>
      )}
      {locked && (
        <p className="text-[12px] text-zinc-500">Tournament is completed — credentials are locked.</p>
      )}
      {msg && <p className="text-[12px] font-medium text-zinc-400">{msg}</p>}
    </div>
  );
}
