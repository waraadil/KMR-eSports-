import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import SupportInbox, {
  type SupportMessageRow,
  type SupportThreadLite,
} from "@/components/support/SupportInbox";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Support" };

export default async function SupportPage({ searchParams }: { searchParams: { t?: string } }) {
  const user = await requireUser("/support");
  const db = getDb();

  const threads = await db
    .prepare(
      `SELECT st.id, st.subject, st.status, st.updated_at,
              (SELECT COUNT(*) FROM support_messages sm WHERE sm.thread_id = st.id) AS message_count
       FROM support_threads st
       WHERE st.user_id = ?
       ORDER BY st.updated_at DESC`
    )
    .all<SupportThreadLite>(user.id);

  const activeThread = threads.find((t) => t.id === searchParams.t) ?? null;
  const messages = activeThread
    ? await db
        .prepare(
          `SELECT sm.id, sm.sender_role, sm.body, sm.created_at, u.username, u.avatar_color
           FROM support_messages sm
           JOIN users u ON u.id = sm.sender_id
           WHERE sm.thread_id = ?
           ORDER BY sm.created_at`
        )
        .all<SupportMessageRow>(activeThread.id)
    : [];

  return (
    <PageShell theme="theme-cyan">
      <Section className="pt-36 md:pt-40">
        <Reveal>
          <p className="eyebrow mb-3">Support</p>
          <h1 className="font-display text-3xl font-bold tracking-tightest text-white md:text-4xl">
            Talk to the team
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-zinc-400">
            Payment issues, slot problems, account trouble — open a request and an admin replies
            right here. You&apos;ll get a notification when they do.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-10">
          <SupportInbox
            viewer="player"
            threads={threads}
            activeThread={activeThread}
            messages={messages}
          />
        </Reveal>
      </Section>
    </PageShell>
  );
}
