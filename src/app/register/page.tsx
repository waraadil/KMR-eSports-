import Image from "next/image";
import PageShell from "@/components/site/PageShell";
import Reveal from "@/components/motion/Reveal";
import { RegisterForm } from "@/components/auth/AuthForms";
import { googleEnabled } from "@/lib/google";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <PageShell theme="theme-volt">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-24 pt-36 md:grid-cols-2 md:px-8">
        <Reveal className="hidden md:block">
          <p className="eyebrow mb-4">Join 12,000+ players</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tightest text-white lg:text-[3.2rem]">
            Start your <span className="text-accent text-glow">conquest</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-400">
            One profile across every title KMR hosts. Free-entry cups to warm up, paid
            brackets when you&apos;re ready to eat.
          </p>

          <div className="relative mt-10 max-w-md overflow-hidden rounded-3xl border border-white/10">
            <Image
              src="/assets/trophy.jpg"
              alt="KMR championship trophy"
              width={896}
              height={560}
              className="h-56 w-full object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void-950/90 via-void-950/20 to-transparent" />
            <p className="absolute bottom-5 left-5 font-tech text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
              ₹50,00,000+ paid out this season
            </p>
          </div>

          <ul className="mt-8 max-w-md space-y-4">
            {[
              "Escrow-protected entries via Razorpay",
              "Season points table — Rookie to Conqueror",
              "Room credentials delivered to your dashboard",
              "Winnings in your wallet within 24 hours",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-[14px] text-zinc-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card mx-auto w-full max-w-md p-8">
            <p className="eyebrow mb-2">Sign up</p>
            <h2 className="mb-8 font-display text-xl font-bold text-white">Create your fighter profile</h2>
            <RegisterForm googleEnabled={googleEnabled()} />
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
