import { cn } from "@/lib/utils";

export default function Marquee({
  items,
  className,
  fast = false,
}: {
  items: string[];
  className?: string;
  fast?: boolean;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("relative overflow-hidden border-y border-white/[0.07] py-4", className)}>
      <div className={`flex w-max gap-10 ${fast ? "animate-marquee-fast" : "animate-marquee"}`}>
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap font-tech text-[12px] font-semibold uppercase tracking-[0.3em] text-zinc-500"
          >
            {item}
            <span className="text-accent">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
