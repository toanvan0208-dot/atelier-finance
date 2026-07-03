type ResetEmailInput = {
  email: string;
  resetUrl: string;
};

const resendEndpoint = "https://api.resend.com/emails";

export async function sendPasswordResetEmail({ email, resetUrl }: ResetEmailInput): Promise<"sent" | "logged"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (apiKey && from) {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Đặt lại mật khẩu Atelier Finance",
        html: [
          "<p>Bạn vừa yêu cầu đặt lại mật khẩu Atelier Finance.</p>",
          `<p><a href="${resetUrl}">Mở liên kết đặt lại mật khẩu</a></p>`,
          "<p>Liên kết này chỉ có hiệu lực trong thời gian ngắn. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>",
        ].join(""),
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to send password reset email.");
    }
    return "sent";
  }

  console.info(`[auth] Password reset link for ${email}: ${resetUrl}`);
  return "logged";
}
