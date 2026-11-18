import { cn } from "@/lib/utils";

export default function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 36 36" className="h-9 w-9">
          <path
            d="M18 1.5 33 10v16L18 34.5 3 26V10L18 1.5Z"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v18M12 17.5 22 9M13.6 16.4 23 27"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[15px] font-bold leading-none tracking-tight text-white">
          KMR<span className="text-accent"> eSports</span>
        </span>
      )}
    </span>
  );
}
