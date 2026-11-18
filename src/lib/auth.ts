import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { SESSION_COOKIE, signSession, verifySession, sessionCookieOptions, type SessionPayload } from "./jwt";

export type SafeUser = {
  id: string;
  email: string;
  username: string;
  role: "PLAYER" | "ORGANIZER" | "ADMIN";
  avatar_color: string;
  bio: string;
  wallet_balance: number;
  created_at: string;
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function checkPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export async function createSession(user: { id: string; username: string; role: SafeUser["role"] }) {
  const token = await signSession({ sub: user.id, username: user.username, role: user.role });
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions);
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  const user = await db
    .prepare(
      "SELECT id, email, username, role, avatar_color, bio, wallet_balance, created_at FROM users WHERE id = ?"
    )
    .get<SafeUser>(session.sub);
  return user ?? null;
}

/** For server-rendered pages — redirects when unauthenticated. */
export async function requireUser(nextPath = "/dashboard"): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin`);
  if (user.role !== "ADMIN" && user.role !== "ORGANIZER") redirect("/dashboard");
  return user;
}
