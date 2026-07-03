import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { verifyPassword } from "@/lib/auth/password";
import { attachSessionCookie, createAuthSession } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail, parseJsonObject, stringField } from "@/lib/auth/request";

const invalidLogin = () =>
  NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonObject(request);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });

  const emailInput = stringField(body, "email");
  const password = stringField(body, "password");
  if (!emailInput || !isValidEmail(emailInput) || !password) return invalidLogin();

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(emailInput) },
    select: { displayName: true, email: true, id: true, passwordHash: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return invalidLogin();

  const session = await createAuthSession({
    userAgent: request.headers.get("user-agent"),
    userId: user.id,
  });
  const response = NextResponse.json({
    ok: true,
    user: { displayName: user.displayName, email: user.email, id: user.id },
  });
  attachSessionCookie(response, session.token, session.expiresAt);
  return response;
}
