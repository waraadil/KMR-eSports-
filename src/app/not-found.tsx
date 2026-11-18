import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <PageShell theme="theme-volt">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-5 text-center">
        <Ghost size={40} className="text-accent" />
        <h1 className="mt-6 font-display text-5xl font-bold tracking-tightest text-white md:text-7xl">404</h1>
        <p className="mt-4 max-w-sm text-[15px] text-zinc-400">
          This lobby doesn&apos;t exist — or it was wiped before you got here.
        </p>
        <Link
          href="/tournaments"
          className="btn-accent mt-8 rounded-full px-8 py-4 font-tech text-[12px] font-bold uppercase tracking-[0.16em]"
        >
          Find a live lobby
        </Link>
      </div>
    </PageShell>
  );
}
