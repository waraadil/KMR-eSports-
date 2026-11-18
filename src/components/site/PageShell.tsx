import { cn } from "@/lib/utils";

/**
 * Wraps a page with its own accent theme so every route has a distinct
 * identity while the chrome (nav/footer) stays consistent.
 */
export default function PageShell({
  theme,
  children,
  className,
  style,
}: {
  theme: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <main className={cn(theme, "relative min-h-screen", className)} style={style}>
      {/* ambient page glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(58% 46% at 50% 0%, var(--accent-soft) 0%, transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </main>
  );
}
