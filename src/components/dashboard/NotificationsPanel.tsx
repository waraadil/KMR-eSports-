"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, CheckCheck, CircleDollarSign, Info, Swords } from "lucide-react";

type Notif = { id: string; title: string; body: string; kind: string; read: number; created_at: string };

const ICONS: Record<string, typeof Bell> = {
  prize: CircleDollarSign,
  payment: CircleDollarSign,
  tournament: Swords,
  system: Info,
};

export default function NotificationsPanel({ items }: { items: Notif[] }) {
  const router = useRouter();
  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch("/api/notifications/read", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <Bell size={13} className="text-accent" /> Notifications
          {unread > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 font-bold text-[10px] text-[var(--on-accent)]">
              {unread}
            </span>
          )}
        </p>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 font-tech text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-white"
          >
            <CheckCheck size={13} /> Mark read
          </button>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {items.length === 0 && (
          <p className="py-6 text-center text-[13px] text-zinc-600">You&apos;re all caught up.</p>
        )}
        {items.slice(0, 6).map((n, i) => {
          const Icon = ICONS[n.kind] ?? Info;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex gap-3.5 rounded-xl border p-3.5 ${
                n.read ? "border-transparent bg-transparent" : "border-white/[0.07] bg-white/[0.03]"
              }`}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">{n.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
