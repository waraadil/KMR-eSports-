import crypto from "node:crypto";

/**
 * Google OAuth 2.0 (hand-rolled, no extra deps).
 * Flow: /api/auth/google → Google consent → /api/auth/google/callback →
 * exchange code → fetch userinfo → find-or-create user → app session cookie.
 */

export const GOOGLE_STATE_COOKIE = "kmr_google_state";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** State = nonce + optional post-login redirect target, base64url-encoded. */
export function newOAuthState(next: string): string {
  const nonce = crypto.randomBytes(12).toString("hex");
  return Buffer.from(JSON.stringify({ n: nonce, next }), "utf8").toString("base64url");
}

export function readOAuthState(raw: string | undefined): { n: string; next: string } | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      n?: unknown;
      next?: unknown;
    };
    if (typeof obj.n === "string" && typeof obj.next === "string") {
      return { n: obj.n, next: obj.next };
    }
    return null;
  } catch {
    return null;
  }
}

export function consentUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleProfile = {
  email: string;
  emailVerified: boolean;
  name: string;
};

/** Exchange the auth code and fetch the verified profile from Google. */
export async function exchangeCodeForProfile(
  origin: string,
  code: string
): Promise<GoogleProfile | null> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return null;

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return null;
    const u = (await userRes.json()) as {
      email?: string;
      verified_email?: boolean;
      name?: string;
    };
    if (!u.email) return null;
    return {
      email: u.email.toLowerCase(),
      emailVerified: Boolean(u.verified_email),
      name: u.name ?? "",
    };
  } catch {
    return null;
  }
}
