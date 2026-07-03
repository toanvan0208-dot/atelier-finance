import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { createRawToken, hashToken } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail, parseJsonObject, stringField } from "@/lib/auth/request";
import { prisma } from "@/lib/database/client";

const resetTtlMs = 1000 * 60 * 30;

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonObject(request);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });

  const emailInput = stringField(body, "email");
  if (!emailInput || !isValidEmail(emailInput)) {
    return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
  }

  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    const token = createRawToken();
    await prisma.passwordResetToken.create({
      data: {
        expiresAt: new Date(Date.now() + resetTtlMs),
        tokenHash: hashToken(token),
        userId: user.id,
      },
    });
    const origin = new URL(request.url).origin;
    await sendPasswordResetEmail({
      email,
      resetUrl: `${origin}/reset-password?token=${encodeURIComponent(token)}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Nếu email tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu.",
  });
}
