"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function ResetPasswordPanel({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        body: JSON.stringify({ password, token }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error === "RESET_TOKEN_INVALID_OR_EXPIRED" ? "Liên kết đã hết hạn hoặc không hợp lệ." : "Mật khẩu cần ít nhất 8 ký tự.");
        return;
      }
      setIsDone(true);
    } catch {
      setError("Chưa thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 py-10">
      <section className="w-full rounded-[2rem] border border-slate-900 bg-white p-6 shadow-[5px_5px_0_rgb(15_23_42_/_0.24)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Đặt lại mật khẩu</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">Tạo mật khẩu mới</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Mật khẩu mới sẽ thay thế mật khẩu cũ và đăng xuất các phiên hiện tại.</p>

        {isDone ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.
            </p>
            <Link className="block rounded-2xl border border-slate-950 bg-slate-950 px-5 py-3 text-center text-sm font-black text-white" href="/">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu mới</span>
              <input
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
            <button
              className="w-full rounded-2xl border border-slate-950 bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !token}
              type="submit"
            >
              {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
