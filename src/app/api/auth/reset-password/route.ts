import { NextResponse } from "next/server";
import { hashPassword, isValidPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/session";
import { parseJsonObject, stringField } from "@/lib/auth/request";
import { prisma } from "@/lib/database/client";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonObject(request);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });

  const token = stringField(body, "token");
  const password = stringField(body, "password");
  if (!token || !password || !isValidPassword(password)) {
    return NextResponse.json({ ok: false, error: "INVALID_RESET_REQUEST" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, error: "RESET_TOKEN_INVALID_OR_EXPIRED" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.authSession.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
