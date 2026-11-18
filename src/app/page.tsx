import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BadgeCheck, CircleDollarSign, ShieldCheck, Timer } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section, { SectionHeading } from "@/components/site/Section";
import Marquee from "@/components/site/Marquee";
import Reveal, { Stagger, StaggerItem } from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";
import TournamentCard from "@/components/tournaments/TournamentCard";
import Hero from "@/components/home/Hero";
import { getFeaturedTournaments, listGames, getPlatformStats, getRecentWinners } from "@/db/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    icon: BadgeCheck,
    step: "01",
    title: "Create your fighter profile",
    body: "One account for every title. Set your IGN, squad name and main game — your match history and points follow you across seasons.",
  },
  {
    icon: CircleDollarSign,
    step: "02",
    title: "Book a slot securely",
    body: "Entry fees are held in escrow via Razorpay. Free-entry cups need no payment at all. Room credentials drop on your dashboard before start.",
  },
  {
    icon: Timer,
    step: "03",
    title: "Play the lobby",
    body: "Join the room 15 minutes early, play your maps, and submit results. Our ops team verifies every lobby before publishing.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Get paid, climb ranks",
    body: "Winnings hit your KMR wallet within 24 hours. Every placement feeds the season points table — from Rookie to Conqueror.",
  },
];

export default async function HomePage() {
  const [featured, games, stats, winners] = await Promise.all([
    getFeaturedTournaments(),
    listGames(),
    getPlatformStats(),
    getRecentWinners(6),
  ]);

  return (
    <PageShell theme="theme-volt">
      <Hero stats={stats} />

      <Marquee
        items={[
          "BGMI Winter Clash — 76/100 slots filled",
          "Live now: CODM Sniper Showdown",
          "₹1,10,000 prize pool this week",
          "Free entry: BGMI Solo FPP Rush",
          "Valorant Neon Nights — 32 team bracket",
          "Instant wallet payouts",
        ]}
      />

      {/* featured tournaments */}
      <Section id="featured">
        <Reveal>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              className="mb-0"
              eyebrow="Featured battles"
              title={<>This week&apos;s <span className="text-accent">biggest lobbies</span></>}
            />
            <Link
              href="/tournaments"
              className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-3 font-tech text-[12px] font-semibold uppercase tracking-[0.16em] text-zinc-200"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t) => (
            <StaggerItem key={t.id}>
              <TournamentCard t={t} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* games */}
      <Section id="games">
        <Reveal>
          <SectionHeading
            eyebrow="Choose your arena"
            title={<>Every title. <span className="text-accent">Every platform.</span></>}
            sub="Mobile, PC and console — if India plays it competitively, we host it. New titles are added every season based on community votes."
          />
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-6 md:grid-cols-3" step={0.06}>
          {games.map((g) => (
            <StaggerItem key={g.id}>
              <TiltCard>
                <Link
                  href={`/tournaments?game=${g.slug}`}
                  className="card card-hover group relative block overflow-hidden"
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={g.cover}
                      alt={g.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="font-tech text-[10px] uppercase tracking-[0.24em]" style={{ color: g.accent }}>
                        {g.publisher}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-white md:text-lg">{g.name}</h3>
                        <ArrowUpRight
                          size={18}
                          className="shrink-0 text-zinc-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                          style={{ color: undefined }}
                        />
                      </div>
                      <p className="mt-1.5 hidden text-[12px] leading-relaxed text-zinc-400 md:block">
                        {g.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* how it works */}
      <Section id="how" className="relative">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:inset-x-8" />
        <Reveal>
          <SectionHeading
            eyebrow="From sign-up to payout"
            title={<>Four steps to your <span className="text-accent">first trophy</span></>}
          />
        </Reveal>
        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" step={0.1}>
          {HOW_IT_WORKS.map((s) => (
            <StaggerItem key={s.step}>
              <div className="card card-hover group relative h-full p-6">
                <div className="mb-8 flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                    <s.icon size={19} />
                  </span>
                  <span className="font-display text-3xl font-bold text-white/[0.08] transition-colors duration-300 group-hover:text-accent">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display text-[15px] font-bold text-white">{s.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">{s.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* winners wall */}
      {winners.length > 0 && (
        <Section id="winners">
          <Reveal>
            <SectionHeading
              eyebrow="Recent payouts"
              title={<>Real players. <span className="text-accent">Real winnings.</span></>}
            />
          </Reveal>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" step={0.07}>
            {winners.map((w, i) => (
              <StaggerItem key={`${w.username}-${i}`}>
                <div className="card card-hover flex items-center gap-4 p-5">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-base font-bold text-void-950"
                    style={{ background: w.avatar_color }}
                  >
                    {w.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[14px] font-bold text-white">{w.username}</p>
                    <p className="truncate text-[12px] text-zinc-500">
                      #{w.placement} · {w.title}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-[15px] font-bold text-accent">
                    {formatINR(w.prize_won)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}

      {/* trophy CTA */}
      <Section id="cta">
        <Reveal>
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0">
              <Image src="/assets/trophy.jpg" alt="Championship trophy" fill className="object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-r from-void-950 via-void-950/70 to-transparent" />
            </div>
            <div className="relative grid gap-10 p-8 md:grid-cols-[1.5fr_1fr] md:p-14">
              <div>
                <p className="eyebrow mb-4">Season 07 standings</p>
                <h2 className="max-w-lg font-display text-3xl font-bold leading-[1.06] tracking-tightest text-white md:text-[2.5rem]">
                  Your name belongs on that trophy wall
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-400">
                  Every placement feeds the season points table. Grind the lobbies, stack
                  your points, and climb from Rookie to Conqueror.
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <Link
                    href="/tournaments"
                    className="btn-accent rounded-full px-8 py-4 font-tech text-[13px] font-bold uppercase tracking-[0.16em]"
                  >
                    Join a tournament
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="btn-ghost rounded-full px-8 py-4 font-tech text-[13px] font-semibold uppercase tracking-[0.16em] text-zinc-200"
                  >
                    See the standings
                  </Link>
                </div>
              </div>
              <div className="hidden items-end justify-end md:flex">
                <p className="text-right font-display text-7xl font-bold leading-none text-white/10">
                  S07
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </PageShell>
  );
}
