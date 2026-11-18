import Link from "next/link";
import { Youtube, Instagram, Twitter, MessageCircle } from "lucide-react";
import Logo from "./Logo";

const COLS = [
  {
    title: "Play",
    links: [
      { label: "All tournaments", href: "/tournaments" },
      { label: "Live now", href: "/tournaments?status=LIVE" },
      { label: "Free entry", href: "/tournaments?fee=free" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Create account", href: "/register" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.07] bg-void-900/60">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-500">
              India&apos;s competitive gaming arena. Join paid &amp; free tournaments
              across every major title — with instant prize payouts.
            </p>
            <div className="mt-6 flex gap-3">
              {[Youtube, Instagram, Twitter, MessageCircle].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Fair play promise
            </p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-500">
              Every paid entry is held in escrow and paid out automatically to winners&apos;
              wallets within 24 hours of result verification.
            </p>
          </div>
        </div>

        <div className="mt-14 select-none overflow-hidden">
          <p className="text-center font-display text-[13vw] font-bold leading-[0.85] tracking-tightest text-white/[0.045] md:text-[9rem]">
            KMR ESPORTS
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 text-[12px] text-zinc-600 md:flex-row">
          <p>© 2026 KMR eSports. All rights reserved.</p>
          <p className="font-tech uppercase tracking-[0.22em]">Join · Compete · Conquer</p>
        </div>
      </div>
    </footer>
  );
}
