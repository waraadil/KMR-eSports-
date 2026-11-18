"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import type { Game } from "@/db/queries";

export default function CreateTournamentForm({ games }: { games: Game[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rules, setRules] = useState<string[]>([""]);
  const [form, setForm] = useState({
    title: "",
    gameId: games[0]?.id ?? "",
    description: "",
    format: "Squad",
    mode: "TPP",
    map: "",
    platform: "Mobile",
    entryFee: "99",
    prizePool: "5000",
    maxSlots: "100",
    startsAt: "",
    featured: false,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          gameId: form.gameId,
          description: form.description,
          format: form.format,
          mode: form.mode,
          map: form.map,
          platform: form.platform,
          entryFeePaise: Math.round(parseFloat(form.entryFee || "0") * 100),
          prizePoolPaise: Math.round(parseFloat(form.prizePool || "0") * 100),
          maxSlots: parseInt(form.maxSlots || "0", 10),
          startsAt: form.startsAt,
          rules: rules.map((r) => r.trim()).filter(Boolean),
          featured: form.featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create tournament");
      router.push(`/admin`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create tournament");
      setBusy(false);
    }
  }

  const label = "mb-2 block font-tech text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400";

  return (
    <form onSubmit={submit} className="card space-y-6 p-7 md:p-9">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Tournament title *</label>
          <input className="input" required minLength={4} value={form.title} onChange={set("title")} placeholder="BGMI Friday Frag Fest" />
        </div>

        <div>
          <label className={label}>Game *</label>
          <select className="input" value={form.gameId} onChange={set("gameId")}>
            {games.map((g) => (
              <option key={g.id} value={g.id} className="bg-void-800">{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Platform *</label>
          <select className="input" value={form.platform} onChange={set("platform")}>
            {["Mobile", "PC", "Console"].map((p) => (
              <option key={p} className="bg-void-800">{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Format *</label>
          <select className="input" value={form.format} onChange={set("format")}>
            {["Solo", "Duo", "Squad", "5v5", "1v1"].map((f) => (
              <option key={f} className="bg-void-800">{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Mode</label>
          <input className="input" value={form.mode} onChange={set("mode")} placeholder="TPP / BR / Premier" />
        </div>

        <div>
          <label className={label}>Map pool</label>
          <input className="input" value={form.map} onChange={set("map")} placeholder="Erangel ×3" />
        </div>

        <div>
          <label className={label}>Start date & time *</label>
          <input className="input" type="datetime-local" required value={form.startsAt} onChange={set("startsAt")} />
        </div>

        <div>
          <label className={label}>Entry fee (₹) — 0 for free</label>
          <input className="input" type="number" min="0" step="1" value={form.entryFee} onChange={set("entryFee")} />
        </div>

        <div>
          <label className={label}>Prize pool (₹)</label>
          <input className="input" type="number" min="0" step="1" value={form.prizePool} onChange={set("prizePool")} />
        </div>

        <div>
          <label className={label}>Max slots</label>
          <input className="input" type="number" min="2" max="512" value={form.maxSlots} onChange={set("maxSlots")} />
        </div>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-3 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Feature on homepage
          </label>
        </div>

        <div className="md:col-span-2">
          <label className={label}>Description *</label>
          <textarea
            className="input min-h-[110px] resize-y"
            required
            minLength={10}
            value={form.description}
            onChange={set("description")}
            placeholder="What makes this lobby special? Format flow, casting, stakes…"
          />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Rules ({rules.filter(Boolean).length})</label>
          <div className="space-y-2.5">
            {rules.map((r, i) => (
              <div key={i} className="flex gap-2.5">
                <input
                  className="input"
                  value={r}
                  onChange={(e) => setRules((rs) => rs.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={`Rule ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-500 hover:border-red-400/50 hover:text-red-400"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRules((rs) => [...rs, ""])}
            className="btn-ghost mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-tech text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
          >
            <Plus size={13} /> Add rule
          </button>
        </div>
      </div>

      {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em] disabled:opacity-60 md:w-auto md:px-10"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={15} />}
        Publish tournament
      </button>
    </form>
  );
}
