import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import CreateTournamentForm from "@/components/admin/CreateTournamentForm";
import { requireAdmin } from "@/lib/auth";
import { listGames } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "New tournament" };

export default async function NewTournamentPage() {
  await requireAdmin();
  const games = await listGames();

  return (
    <PageShell theme="theme-rose">
      <Section className="max-w-4xl pt-36 md:pt-40">
        <Reveal>
          <p className="eyebrow mb-4">Control room</p>
          <h1 className="mb-12 font-display text-3xl font-bold tracking-tightest text-white md:text-4xl">
            Host a new <span className="text-accent text-glow">tournament</span>
          </h1>
          <CreateTournamentForm games={games} />
        </Reveal>
      </Section>
    </PageShell>
  );
}
