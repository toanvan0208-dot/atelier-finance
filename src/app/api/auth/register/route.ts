import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/client";
import { hashPassword, isValidPassword } from "@/lib/auth/password";
import { attachSessionCookie, createAuthSession } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail, parseJsonObject, stringField } from "@/lib/auth/request";

const json = (body: unknown, status = 200): NextResponse => NextResponse.json(body, { status });

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonObject(request);
  if (!body) return json({ ok: false, error: "INVALID_JSON" }, 400);

  const emailInput = stringField(body, "email");
  const password = stringField(body, "password");
  const displayName = stringField(body, "displayName");
  if (!emailInput || !isValidEmail(emailInput)) {
    return json({ ok: false, error: "INVALID_EMAIL" }, 400);
  }
  if (!password || !isValidPassword(password)) {
    return json({ ok: false, error: "INVALID_PASSWORD" }, 400);
  }

  const email = normalizeEmail(emailInput);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return json({ ok: false, error: "EMAIL_ALREADY_REGISTERED" }, 409);
  }

  const user = await prisma.user.create({
    data: {
      displayName,
      email,
      passwordHash: await hashPassword(password),
    },
    select: { displayName: true, email: true, id: true },
  });
  const session = await createAuthSession({
    userAgent: request.headers.get("user-agent"),
    userId: user.id,
  });
  const response = json({ ok: true, user }, 201);
  attachSessionCookie(response, session.token, session.expiresAt);
  return response;
}
