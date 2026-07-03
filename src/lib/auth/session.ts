import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";

export const authCookieName = "atelier_session";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const createRawToken = (): string => randomBytes(32).toString("base64url");

export async function createAuthSession({
  userAgent,
  userId,
}: {
  userAgent?: string | null;
  userId: string;
}): Promise<{ expiresAt: Date; token: string }> {
  const token = createRawToken();
  const expiresAt = new Date(Date.now() + sessionTtlMs);

  await prisma.authSession.create({
    data: {
      expiresAt,
      tokenHash: hashToken(token),
      userAgent: userAgent ?? null,
      userId,
    },
  });

  return { expiresAt, token };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(authCookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(authCookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
  };
}

export async function deleteCurrentSession(): Promise<void> {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return;
  await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
