import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { forgotPasswordSchema } from "@/lib/validators";
import { handleRouteError } from "@/lib/api";
import { createPasswordReset } from "@/lib/resets";
import { notifyAdmins } from "@/lib/notify";
import { emailEnabled, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const GENERIC =
  "If an account matches, recovery has started. If email is set up you'll receive a reset link shortly — otherwise the team has been notified and can share one after verifying you.";

/**
 * Public: start password recovery for an email or username.
 * Always answers the same way so account existence isn't leaked.
 * - Creates a 30-min reset token (hash stored, raw only ever leaves via link)
 * - Emails the link when Resend is configured
 * - Pings admins either way so manual (WhatsApp/Discord) recovery always works
 */
export async function POST(req: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await req.json());
    const db = getDb();

    const user = await db
      .prepare("SELECT id, email, username FROM users WHERE email = ? OR username = ?")
      .get<{ id: string; email: string; username: string }>(body.identifier, body.identifier);

    if (user) {
      const { rawToken } = await createPasswordReset(db, user.id, "self");
      const link = `${req.nextUrl.origin}/reset-password?token=${rawToken}`;

      if (emailEnabled()) {
        await sendEmail(
          user.email,
          "Reset your KMR eSports password",
          `<p>Hi ${user.username},</p>
           <p>Someone asked to reset your KMR eSports password. This link works for <b>30 minutes</b>:</p>
           <p><a href="${link}">${link}</a></p>
           <p>If it wasn't you, ignore this mail — your password stays unchanged.</p>`
        );
      }
      await notifyAdmins(
        db,
        "Password reset requested",
        `${user.username} (${user.email}) asked for a password reset. Verify them and share a reset link from the support console.`,
        "support"
      );
    }

    return NextResponse.json({ ok: true, message: GENERIC, emailed: Boolean(user && emailEnabled()) });
  } catch (err) {
    return handleRouteError(err);
  }
}
