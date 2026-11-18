import { Suspense } from "react";
import PageShell from "@/components/site/PageShell";
import Reveal from "@/components/motion/Reveal";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password" };

function ResetInner({ token }: { token: string }) {
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <PageShell theme="theme-volt">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-5 pb-24 pt-36 md:px-8">
        <Reveal className="w-full max-w-md">
          <div className="card p-8">
            <p className="eyebrow mb-2">Reset password</p>
            <h2 className="mb-8 font-display text-xl font-bold text-white">Choose a new password</h2>
            <Suspense>
              <ResetInner token={searchParams.token ?? ""} />
            </Suspense>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
