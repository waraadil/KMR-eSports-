import PageShell from "@/components/site/PageShell";
import Section from "@/components/site/Section";
import Reveal from "@/components/motion/Reveal";
import SupportInbox, {
  type SupportMessageRow,
  type SupportThreadLite,
} from "@/components/support/SupportInbox";
import ResetsPanel, { type ResetRequestRow } from "@/components/admin/ResetsPanel";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Support console" };

export default async function AdminSupportPage({ searchParams }: { searchParams: { t?: string } }) {
  await requireAdmin();
  const db = getDb();

  const threads = await db
    .prepare(
      `SELECT st.id, st.subject, st.status, st.updated_at, u.username,
              (SELECT COUNT(*) FROM support_messages sm WHERE sm.thread_id = st.id) AS message_count
       FROM support_threads st
       JOIN users u ON u.id = st.user_id
       ORDER BY CASE st.status WHEN 'OPEN' THEN 0 ELSE 1 END, st.updated_at DESC`
    )
    .all<SupportThreadLite>();

  const resets = await db
    .prepare(
      `SELECT pr.user_id, u.username, u.email, pr.requested_via, pr.created_at
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.status = 'PENDING' AND pr.expires_at > datetime('now')
       ORDER BY pr.created_at DESC
       LIMIT 50`
    )
    .all<ResetRequestRow>();

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
    <PageShell theme="theme-rose">
      <Section className="pt-36 md:pt-40">
        <Reveal>
          <p className="eyebrow mb-3">Admin</p>
          <h1 className="font-display text-3xl font-bold tracking-tightest text-white md:text-4xl">
            Support console
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-zinc-400">
            Player issues land here — reply in-thread, close when resolved, and handle password
            reset requests below.
          </p>
        </Reveal>
        <Reveal delay={0.06} className="mt-10">
          <ResetsPanel requests={resets} />
        </Reveal>
        <Reveal delay={0.1} className="mt-6">
          <SupportInbox
            viewer="admin"
            threads={threads}
            activeThread={activeThread}
            messages={messages}
          />
        </Reveal>
      </Section>
    </PageShell>
  );
}
