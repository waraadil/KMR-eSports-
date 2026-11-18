import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard, listGames } from "@/db/queries";
import { CURRENT_SEASON } from "@/lib/points";
import { Ghost } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { game?: string };
}) {
  const game = searchParams.game || "all";
  const games = listGames();
  const rows = getLeaderboard({ gameSlug: game, limit: 50 });

  return (
    <PageShell theme="theme-gold">
      <Section className="pt-36 md:pt-44">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-4">{CURRENT_SEASON} · Points table</p>
              <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.04] tracking-tightest text-white md:text-[3.4rem]">
                The road to <span className="text-accent text-glow">Conqueror</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
                Every KMR tournament feeds this table — placement points plus one point per
                elimination. Climb the tiers from Rookie to Conqueror and get noticed by orgs.
              </p>
            </div>
            <div className="card flex items-center gap-6 px-7 py-5">
              <div>
                <p className="font-display text-2xl font-bold text-accent">{rows.length}</p>
                <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">Ranked players</p>
              </div>
              <span className="h-9 w-px bg-white/10" />
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  {rows.reduce((a, r) => a + r.matches, 0)}
                </p>
                <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-zinc-500">Matches scored</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 flex flex-wrap gap-2.5">
            <Link
              href="/leaderboard"
              data-active={game === "all"}
              className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
            >
              All games
            </Link>
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/leaderboard?game=${g.slug}`}
                data-active={game === g.slug}
                className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="mt-12">
          {rows.length > 0 ? (
            <LeaderboardTable rows={rows} />
          ) : (
            <div className="card flex flex-col items-center gap-4 py-20 text-center">
              <Ghost size={28} className="text-zinc-600" />
              <p className="font-display text-lg font-bold text-white">No ranked players yet</p>
              <p className="max-w-sm text-sm text-zinc-500">
                This game&apos;s season hasn&apos;t started. Be the first name on the board.
              </p>
            </div>
          )}
        </div>
      </Section>
    </PageShell>
  );
}
