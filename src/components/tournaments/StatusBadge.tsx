import { cn } from "@/lib/utils";

export default function StatusBadge({
  status,
  className,
}: {
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
  className?: string;
}) {
  if (status === "LIVE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-red-400",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-live-dot" />
        Live
      </span>
    );
  }
  const map = {
    UPCOMING: "bg-[var(--accent-soft)] text-accent",
    COMPLETED: "bg-white/[0.07] text-zinc-400",
    CANCELLED: "bg-white/[0.07] text-zinc-500",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.2em]",
        map[status],
        className
      )}
    >
      {status === "UPCOMING" ? "Upcoming" : status === "COMPLETED" ? "Completed" : "Cancelled"}
    </span>
  );
}
