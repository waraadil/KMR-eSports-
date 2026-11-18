import Link from "next/link";
import Image from "next/image";
import { Users, Trophy, CalendarDays, Gamepad2 } from "lucide-react";
import type { TournamentWithMeta } from "@/db/queries";
import StatusBadge from "./StatusBadge";
import { formatINR, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function TournamentCard({
  t,
  className,
}: {
  t: TournamentWithMeta;
  className?: string;
}) {
  const fillPct = Math.min(100, Math.round((t.filled_slots / t.max_slots) * 100));
  const almostFull = fillPct >= 85 && t.status === "UPCOMING";

  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className={cn("card card-hover group relative block overflow-hidden", className)}
    >
      {/* cover */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={t.game_cover}
          alt={t.game_name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b14] via-[#0b0b14]/35 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <StatusBadge status={t.status} />
          {t.entry_fee === 0 && (
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              Free entry
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span
            className="clipped-tag px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.18em] text-void-950"
            style={{ background: t.game_accent }}
          >
            {t.game_name}
          </span>
          <span className="rounded-full bg-black/45 px-3 py-1 font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-300 backdrop-blur">
            {t.platform}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-display text-[15px] font-bold leading-snug text-white transition-colors group-hover:text-accent">
            {t.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-3 font-tech text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Gamepad2 size={12} /> {t.format}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} /> {formatDateTime(t.starts_at)}
            </span>
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">Prize pool</p>
            <p className="flex items-center gap-1.5 font-display text-lg font-bold text-accent">
              <Trophy size={15} /> {formatINR(t.prize_pool)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">Entry</p>
            <p className="font-display text-lg font-bold text-white">
              {t.entry_fee === 0 ? "FREE" : formatINR(t.entry_fee)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Users size={11} /> {t.filled_slots}/{t.max_slots} slots
            </span>
            <span className={almostFull ? "font-bold text-red-400" : ""}>
              {almostFull ? "Almost full" : `${fillPct}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn("h-full rounded-full transition-all", almostFull ? "bg-red-400" : "bg-accent")}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
