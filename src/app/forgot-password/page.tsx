import PageShell from "@/components/site/PageShell";
import Reveal from "@/components/motion/Reveal";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { emailEnabled } from "@/lib/email";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <PageShell theme="theme-volt">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-24 pt-36 md:grid-cols-2 md:px-8">
        <Reveal className="hidden md:block">
          <p className="eyebrow mb-4">Account recovery</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tightest text-white lg:text-[3.2rem]">
            Locked out? <span className="text-accent text-glow">We got you</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-400">
            Enter your email or username and we&apos;ll start recovery. The KMR team is pinged
            either way, so you can also just reach us on WhatsApp/Discord and we&apos;ll verify
            you and share a reset link.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card mx-auto w-full max-w-md p-8">
            <p className="eyebrow mb-2">Forgot password</p>
            <h2 className="mb-8 font-display text-xl font-bold text-white">Recover your account</h2>
            <ForgotPasswordForm emailOn={emailEnabled()} />
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
