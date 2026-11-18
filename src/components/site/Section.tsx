import { cn } from "@/lib/utils";

export default function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tightest text-white md:text-[2.6rem]">
        {title}
      </h2>
      {sub && <p className="mt-5 text-[15px] leading-relaxed text-zinc-400">{sub}</p>}
    </div>
  );
}
