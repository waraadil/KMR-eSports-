import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kmr_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  // Priority: explicit AUTH_SECRET → the Turso/DB token (high-entropy, injected
  // by the Vercel Turso integration — keeps production sessions secure with no
  // extra config) → insecure local-dev fallback.
  const secret =
    process.env.AUTH_SECRET ||
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[KMR] AUTH_SECRET is not set — using an insecure development fallback.");
    }
    return new TextEncoder().encode("kmr-dev-insecure-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  username: string;
  role: "PLAYER" | "ORGANIZER" | "ADMIN";
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("kmr-esports")
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "kmr-esports" });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      username: String(payload.username ?? ""),
      role: (payload.role as SessionPayload["role"]) ?? "PLAYER",
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
