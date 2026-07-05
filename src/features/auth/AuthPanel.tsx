"use client";

import { FormEvent, useState } from "react";

type AuthMode = "login" | "register" | "forgot";

const modeCopy: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  forgot: {
    description: "Nhập email để nhận liên kết đặt lại mật khẩu. Nếu chưa cấu hình email thật, link sẽ hiện trong terminal dev.",
    eyebrow: "Quên mật khẩu",
    submit: "Gửi liên kết đặt lại",
    title: "Lấy lại quyền truy cập",
  },
  login: {
    description: "Tiếp tục lộ trình phân tích, watchlist và mô phỏng cá nhân của bạn.",
    eyebrow: "Đăng nhập",
    submit: "Đăng nhập",
    title: "Đăng nhập vào không gian phân tích",
  },
  register: {
    description: "Tạo tài khoản để lưu watchlist, mô phỏng và tiến trình phân tích riêng.",
    eyebrow: "Đăng ký",
    submit: "Tạo tài khoản",
    title: "Tạo hồ sơ học đầu tư",
  },
};

const passwordHint = "Mật khẩu cần ít nhất 8 ký tự.";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = modeCopy[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : mode === "register"
          ? "/api/auth/register"
          : "/api/auth/forgot-password";
    const payload =
      mode === "forgot"
        ? { email }
        : {
            displayName: displayName || undefined,
            email,
            password,
          };

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) {
        setError(readableAuthError(data.error));
        return;
      }

      if (mode === "forgot") {
        setMessage(data.message ?? "Nếu email tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu.");
        return;
      }

      window.location.href = "/workspace";
    } catch {
      setError("Chưa thể kết nối máy chủ đăng nhập. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <aside className="rounded-[2rem] border border-slate-900 bg-white p-6 shadow-[5px_5px_0_rgb(15_23_42_/_0.24)] sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">{copy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Tên hiển thị</span>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Tên của bạn"
              type="text"
              value={displayName}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
          <input
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        {mode !== "forgot" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu</span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              type="password"
              value={password}
            />
            {mode === "register" ? <span className="mt-2 block text-xs font-semibold text-slate-500">{passwordHint}</span> : null}
          </label>
        ) : null}

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
        {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}

        <button
          className="w-full rounded-2xl border border-slate-950 bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang xử lý..." : copy.submit}
        </button>
      </form>

      <div className="mt-5 space-y-3 text-center text-sm text-slate-500">
        {mode !== "login" ? (
          <button className="font-black text-slate-950" onClick={() => setMode("login")} type="button">
            Đã có tài khoản? Đăng nhập
          </button>
        ) : (
          <button className="font-black text-slate-950" onClick={() => setMode("register")} type="button">
            Chưa có tài khoản? Tạo hồ sơ học đầu tư
          </button>
        )}
        {mode !== "forgot" ? (
          <div>
            <button className="font-bold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline" onClick={() => setMode("forgot")} type="button">
              Quên mật khẩu?
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>Lưu ý:</strong> Hệ thống không đưa ra khuyến nghị mua, bán hoặc nắm giữ cổ phiếu. Nội dung chỉ phục vụ học tập, phân tích và tham khảo.
      </div>
    </aside>
  );
}

function readableAuthError(error?: string): string {
  if (error === "EMAIL_ALREADY_REGISTERED") return "Email này đã được đăng ký.";
  if (error === "INVALID_CREDENTIALS") return "Email hoặc mật khẩu không đúng.";
  if (error === "INVALID_EMAIL") return "Email chưa hợp lệ.";
  if (error === "INVALID_PASSWORD") return passwordHint;
  if (error === "RESET_TOKEN_INVALID_OR_EXPIRED") return "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.";
  return "Chưa thể hoàn tất thao tác. Vui lòng thử lại.";
}
