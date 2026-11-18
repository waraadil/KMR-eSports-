import { Suspense } from "react";
import PageShell from "@/components/site/PageShell";
import Reveal from "@/components/motion/Reveal";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <PageShell theme="theme-magenta">
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
          <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
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
              <LoginForm />
            </Suspense>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
