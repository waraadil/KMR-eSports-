"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, ShieldHalf, LogOut } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { initialOf } from "@/lib/format";

type NavUser = { username: string; role: string; avatar_color: string } | null;

const LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

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
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-500 md:px-8",
          scrolled ? "py-3" : "py-5"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 border-b border-white/0 transition-all duration-500",
            scrolled && "border-white/[0.07] bg-void-950/80 backdrop-blur-xl"
          )}
        />
        <Link href="/" className="relative z-10">
          <Logo />
        </Link>

        <nav className="relative z-10 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-4 py-2 font-tech text-[13px] font-medium uppercase tracking-[0.18em] transition-colors",
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role !== "PLAYER" && (
                <Link
                  href="/admin"
                  className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                >
                  <ShieldHalf size={14} /> Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-4 transition-colors hover:border-white/25"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full font-display text-[11px] font-bold text-void-950"
                  style={{ background: user.avatar_color }}
                >
                  {initialOf(user.username)}
                </span>
                <span className="font-tech text-[13px] font-semibold uppercase tracking-wider text-zinc-200">
                  {user.username}
                </span>
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  title="Log out"
                  className="btn-ghost grid h-9 w-9 place-items-center rounded-full text-zinc-400"
                >
                  <LogOut size={15} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-ghost rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
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

        <button
          className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 mt-1 rounded-2xl border border-white/10 bg-void-900/95 p-3 backdrop-blur-xl md:hidden"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-tech text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300 hover:bg-white/5"
              >
                {l.href === "/dashboard" && <LayoutDashboard size={15} />}
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/10 pt-3">
              {user ? (
                <form action="/api/auth/logout" method="post">
                  <button className="w-full rounded-xl bg-white/[0.06] px-4 py-3 text-left font-tech text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">
                    Log out — {user.username}
                  </button>
                </form>
              ) : (
                <Link
                  href="/register"
                  className="btn-accent block rounded-xl px-4 py-3 text-center font-tech text-sm font-bold uppercase tracking-[0.16em]"
                >
                  Join the arena
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
