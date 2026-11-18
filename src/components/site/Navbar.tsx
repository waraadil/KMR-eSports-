"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  BarChart3,
  LayoutDashboard,
  ShieldHalf,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { initialOf } from "@/lib/format";

type NavUser = { username: string; role: string; avatar_color: string } | null;

type NavLink = { href: string; label: string; icon: LucideIcon };
const LINKS: NavLink[] = [
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

/* Echo-style liquid glass surface: heavy blur, translucency, specular top edge */
const GLASS =
  "border border-white/[0.12] bg-white/[0.055] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),inset_0_-1px_0_0_rgba(255,255,255,0.03),0_16px_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl backdrop-saturate-150";

export default function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* ── floating liquid-glass bar ─────────────────────────────────── */}
      <div
        className={cn(
          "mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 transition-all duration-500 md:px-5",
          scrolled ? "pt-3" : "pt-5"
        )}
      >
        <div
          className={cn(
            GLASS,
            "relative flex h-14 flex-1 items-center justify-between gap-2 rounded-full pl-2 pr-2 transition-all duration-500",
            scrolled && "bg-white/[0.075]"
          )}
        >
          <Link href="/" aria-label="KMR eSports home">
            <Logo />
          </Link>

          {/* center links with sliding glass pill (desktop) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 font-tech text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300",
                    active ? "text-void-950" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-glass-pill"
                      className="absolute inset-0 rounded-full bg-accent shadow-[0_4px_20px_-4px_var(--accent-glow),inset_0_1px_0_0_rgba(255,255,255,0.35)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* right cluster */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {user.role !== "PLAYER" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 font-tech text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <ShieldHalf size={13} /> Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.06] py-1 pl-1 pr-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.1]"
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                    style={{ background: user.avatar_color }}
                  >
                    {initialOf(user.username)}
                  </span>
                  <span className="max-w-[9rem] truncate font-tech text-[12px] font-semibold uppercase tracking-wider text-zinc-100">
                    {user.username}
                  </span>
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    title="Log out"
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-red-400"
                  >
                    <LogOut size={15} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="btn-accent rounded-full px-5 py-2.5 font-tech text-[12px] font-bold uppercase tracking-[0.14em]"
                >
                  Join the arena
                </Link>
              </>
            )}
          </div>

          {/* mobile: avatar + menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <span
                className="grid h-8 w-8 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                style={{ background: user.avatar_color }}
              >
                {initialOf(user.username)}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
            >
              {/* morphing burger → close */}
              <span className="relative block h-3 w-[18px]">
                <motion.span
                  className="absolute left-0 top-0 h-[1.6px] w-full rounded-full bg-current"
                  animate={open ? { top: "5.2px", rotate: 45 } : { top: "0px", rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
                <motion.span
                  className="absolute left-0 top-[5.2px] h-[1.6px] w-full rounded-full bg-current"
                  animate={open ? { opacity: 0, x: 6 } : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                />
                <motion.span
                  className="absolute left-0 top-[10.4px] h-[1.6px] w-full rounded-full bg-current"
                  animate={open ? { top: "5.2px", rotate: -45 } : { top: "10.4px", rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── liquid-glass dropdown (mobile) ────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(GLASS, "mx-4 mt-2 origin-top rounded-[28px] p-2.5 md:hidden")}
          >
            {LINKS.map((l, i) => {
              const active = pathname.startsWith(l.href);
              const Icon = l.icon;
              return (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, type: "spring", stiffness: 420, damping: 30 }}
                >
                  <Link
                    href={l.href}
                    className={cn(
                      "group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors",
                      active ? "bg-accent/10" : "hover:bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
                        active
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-white/[0.1] bg-white/[0.05] text-zinc-300"
                      )}
                    >
                      <Icon size={17} />
                    </span>
                    <span
                      className={cn(
                        "flex-1 font-tech text-[13px] font-bold uppercase tracking-[0.18em]",
                        active ? "text-accent" : "text-zinc-200"
                      )}
                    >
                      {l.label}
                    </span>
                    <ChevronRight
                      size={15}
                      className={cn(
                        "transition-transform group-hover:translate-x-0.5",
                        active ? "text-accent" : "text-zinc-600"
                      )}
                    />
                  </Link>
                </motion.div>
              );
            })}

            <div className="mt-2 border-t border-white/[0.08] pt-2.5">
              {user ? (
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[12px] font-bold text-void-950"
                    style={{ background: user.avatar_color }}
                  >
                    {initialOf(user.username)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-tech text-[13px] font-bold uppercase tracking-wider text-white">
                      {user.username}
                    </p>
                    <p className="font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {user.role === "PLAYER" ? "Competitor" : "Organiser"}
                    </p>
                  </div>
                  {user.role !== "PLAYER" && (
                    <Link
                      href="/admin"
                      className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200"
                    >
                      Admin
                    </Link>
                  )}
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-zinc-400 transition-colors hover:text-red-400"
                      aria-label="Log out"
                    >
                      <LogOut size={14} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex gap-2 px-1 pb-1">
                  <Link
                    href="/login"
                    className="flex-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-center font-tech text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-200"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="btn-accent flex-1 rounded-full px-4 py-3 text-center font-tech text-[12px] font-bold uppercase tracking-[0.16em]"
                  >
                    Join the arena
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
