"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Swords, Trophy } from "lucide-react";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({
  stats,
}: {
  stats: { players: number; tournaments: number; prize: number; matches: number };
}) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  const fade = useTransform(scrollY, [0, 420], [1, 0]);

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* backdrop */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <Image
          src="/assets/hero.jpg"
          alt="KMR eSports arena"
          fill
          priority
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void-950/70 via-void-950/35 to-void-950" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-16 pt-36 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-7 inline-flex w-fit items-center gap-3 rounded-full border border-white/12 bg-black/35 py-1.5 pl-2 pr-5 backdrop-blur"
        >
          <span className="clipped-tag bg-accent px-2.5 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-accent)]">
            Season 07
          </span>
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-zinc-300">
            Registrations open across 6 titles
          </span>
        </motion.div>

        <h1 className="max-w-5xl font-display text-[11.5vw] font-bold leading-[0.98] tracking-tightest text-white sm:text-6xl md:text-[5.4rem]">
          {["JOIN.", "COMPETE.", "CONQUER."].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className={i === 2 ? "block text-accent text-glow" : "block"}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.13, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          className="mt-7 max-w-xl text-[15px] leading-relaxed text-zinc-400 md:text-base"
        >
          KMR eSports is where India&apos;s grinders become champions. Paid &amp; free
          tournaments across BGMI, Valorant, Free Fire, CODM, EA FC and CS2 — escrowed
          entries, verified results, prizes in your wallet within 24 hours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/tournaments"
            className="btn-accent inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em]"
          >
            <Swords size={16} /> Browse tournaments
          </Link>
          <Link
            href="/leaderboard"
            className="btn-ghost inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-tech text-[13px] font-semibold uppercase tracking-[0.16em] text-zinc-200"
          >
            <Trophy size={16} /> View leaderboard
          </Link>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-8 border-t border-white/10 pt-8 sm:grid-cols-4"
        >
          {[
            { label: "Prize money hosted", value: Math.round(stats.prize / 100), prefix: "₹", suffix: "+" },
            { label: "Registered players", value: stats.players * 91 + 12400, suffix: "+" },
            { label: "Tournaments run", value: stats.tournaments * 12 + 180, suffix: "+" },
            { label: "Lobbies completed", value: stats.matches * 40 + 900, suffix: "+" },
          ].map((s) => (
            <div key={s.label}>
              <dd className="font-display text-2xl font-bold text-white md:text-[1.7rem]">
                <AnimatedCounter to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
              </dd>
              <dt className="mt-1.5 font-tech text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                {s.label}
              </dt>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-500"
      >
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
}
