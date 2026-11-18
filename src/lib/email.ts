/**
 * Outbound email via Resend (https://resend.com) — env-gated like Google auth.
 * Set RESEND_API_KEY + EMAIL_FROM (e.g. "KMR eSports <noreply@kmr.gg>") to enable.
 * Until then every mail is skipped silently and flows fall back to admin-assist.
 */

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
