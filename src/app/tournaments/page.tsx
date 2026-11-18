import Link from "next/link";
import { Search, Swords } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal, { Stagger, StaggerItem } from "@/components/motion/Reveal";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { listGames, listTournaments } from "@/db/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tournaments" };

type SP = { [key: string]: string | string[] | undefined };

function pick(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function TournamentsPage({ searchParams }: { searchParams: SP }) {
  const status = pick(searchParams, "status") || "ALL";
  const game = pick(searchParams, "game") || "all";
  const platform = pick(searchParams, "platform") || "all";
  const fee = pick(searchParams, "fee");
  const q = pick(searchParams, "q");

  const games = await listGames();
  const tournaments = await listTournaments({
    status: status as "LIVE" | "UPCOMING" | "COMPLETED" | "ALL",
    game,
    platform,
    fee: fee === "free" ? "free" : fee === "paid" ? "paid" : undefined,
    q: q || undefined,
  });

  const href = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const cur = { status, game, platform, fee, q, ...patch };
    for (const [k, v] of Object.entries(cur)) {
      if (v && v !== "ALL" && v !== "all") params.set(k, v);
    }
    const s = params.toString();
    return `/tournaments${s ? `?${s}` : ""}`;
  };

  const STATUS_TABS = [
    { id: "ALL", label: "All" },
    { id: "LIVE", label: "Live now" },
    { id: "UPCOMING", label: "Upcoming" },
    { id: "COMPLETED", label: "Completed" },
  ];

  return (
    <PageShell theme="theme-violet">
      <Section className="pt-36 md:pt-44">
        <Reveal>
          <p className="eyebrow mb-4">All arenas</p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.04] tracking-tightest text-white md:text-[3.4rem]">
              Find your next <span className="text-accent text-glow">battle</span>
            </h1>
            <p className="pb-1 font-tech text-[12px] uppercase tracking-[0.22em] text-zinc-500">
              {tournaments.length} tournament{tournaments.length === 1 ? "" : "s"} found
            </p>
          </div>
        </Reveal>

        {/* filter bar */}
        <Reveal delay={0.1}>
          <div className="card mt-12 space-y-5 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {STATUS_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={href({ status: t.id === "ALL" ? "" : t.id })}
                  data-active={status === t.id}
                  className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                >
                  {t.label}
                </Link>
              ))}
              <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
              <Link
                href={href({ fee: fee === "free" ? "" : "free" })}
                data-active={fee === "free"}
                className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
              >
                Free entry
              </Link>
              <Link
                href={href({ fee: fee === "paid" ? "" : "paid" })}
                data-active={fee === "paid"}
                className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
              >
                Paid
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={href({ game: "" })}
                data-active={game === "all"}
                className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
              >
                All games
              </Link>
              {games.map((g) => (
                <Link
                  key={g.id}
                  href={href({ game: g.slug })}
                  data-active={game === g.slug}
                  className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {["all", "Mobile", "PC", "Console"].map((p) => (
                <Link
                  key={p}
                  href={href({ platform: p === "all" ? "" : p })}
                  data-active={platform === p}
                  className="chip rounded-full px-5 py-2.5 font-tech text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-300"
                >
                  {p === "all" ? "All platforms" : p}
                </Link>
              ))}

              <form action="/tournaments" method="get" className="relative ml-auto w-full sm:w-64">
                {status !== "ALL" && <input type="hidden" name="status" value={status} />}
                {game !== "all" && <input type="hidden" name="game" value={game} />}
                {platform !== "all" && <input type="hidden" name="platform" value={platform} />}
                {fee && <input type="hidden" name="fee" value={fee} />}
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search tournaments…"
                  className="input !rounded-full !pl-11"
                />
              </form>
            </div>
          </div>
        </Reveal>

        {/* grid */}
        {tournaments.length > 0 ? (
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" step={0.06}>
            {tournaments.map((t) => (
              <StaggerItem key={t.id}>
                <TournamentCard t={t} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="card mt-12 flex flex-col items-center gap-4 py-20 text-center">
            <Swords size={28} className="text-zinc-600" />
            <p className="font-display text-lg font-bold text-white">No lobbies match those filters</p>
            <p className="max-w-sm text-sm text-zinc-500">
              Try clearing a filter or check back soon — new tournaments drop every week.
            </p>
            <Link
              href="/tournaments"
              className="btn-accent mt-2 rounded-full px-6 py-3 font-tech text-[12px] font-bold uppercase tracking-[0.16em]"
            >
              Clear filters
            </Link>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
