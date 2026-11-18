import { Suspense } from "react";
import Image from "next/image";
import PageShell from "@/components/site/PageShell";
import Reveal from "@/components/motion/Reveal";
import { LoginForm } from "@/components/auth/AuthForms";
import { googleEnabled } from "@/lib/google";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <PageShell theme="theme-volt">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-24 pt-36 md:grid-cols-2 md:px-8">
        <Reveal className="hidden md:block">
          <p className="eyebrow mb-4">Welcome back, champion</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tightest text-white lg:text-[3.2rem]">
            Your lobby is <span className="text-accent text-glow">waiting</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-400">
            Pick up where you left off — your wallet, match schedule and season points are
            exactly where you dropped them.
          </p>

          <div className="relative mt-10 max-w-md overflow-hidden rounded-3xl border border-white/10">
            <Image
              src="/assets/hero.jpg"
              alt="KMR eSports arena"
              width={896}
              height={560}
              className="h-56 w-full object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void-950/90 via-void-950/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
              <p className="font-tech text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Tonight&apos;s lobbies are live
              </p>
              <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-void-950/70 px-2.5 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.14em] text-accent backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live
              </span>
            </div>
          </div>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              ["2 min", "avg. check-in time"],
              ["24 h", "prize payout SLA"],
              ["6", "titles supported"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-xl font-bold text-accent">{v}</p>
                <p className="mt-1 font-tech text-[10px] uppercase tracking-[0.16em] text-zinc-500">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card mx-auto w-full max-w-md p-8">
            <p className="eyebrow mb-2">Log in</p>
            <h2 className="mb-8 font-display text-xl font-bold text-white">Back to the grind</h2>
            <Suspense>
              <LoginForm googleEnabled={googleEnabled()} />
            </Suspense>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
