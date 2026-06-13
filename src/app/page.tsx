import Link from "next/link";

const analysisPath = [
  "Vĩ mô",
  "Ngành",
  "Lọc cổ phiếu",
  "Doanh nghiệp",
  "Tài chính",
  "Định giá",
  "Rủi ro",
  "Mô phỏng",
];

const valueCards = [
  {
    title: "Có lộ trình rõ ràng",
    description: "Biết mình đang ở bước nào và cần phân tích gì tiếp theo.",
  },
  {
    title: "Dữ liệu được giải thích dễ hiểu",
    description: "Không chỉ hiển thị số liệu, mà còn giúp người dùng hiểu ý nghĩa.",
  },
  {
    title: "Không khuyến nghị mua bán",
    description: "Hệ thống hỗ trợ tư duy phân tích, không thay bạn ra quyết định.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-900 bg-slate-950 text-sm font-black text-amber-300 shadow-[4px_4px_0_#fbbf24]">
              AF
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Atelier Finance
              </p>
              <p className="text-sm text-slate-500">Cửa vào hệ thống phân tích</p>
            </div>
          </div>

          <p className="mb-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-800">
            Dành cho người mới học phân tích cổ phiếu
          </p>

          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
            Phân tích cổ phiếu theo quy trình, không theo cảm tính.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Atelier Finance giúp người mới đi từng bước từ vĩ mô, ngành, doanh nghiệp, báo cáo tài chính, định giá đến rủi ro trước khi mô phỏng quyết định đầu tư.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {valueCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Lộ trình phân tích rút gọn
            </p>
            <div className="flex flex-wrap gap-2">
              {analysisPath.map((step, index) => (
                <span
                  key={step}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-900 bg-white p-6 shadow-[8px_8px_0_#0f172a] sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Đăng nhập
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
              Đăng nhập vào không gian phân tích
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tiếp tục lộ trình của bạn hoặc dùng bản demo để khám phá hệ thống.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              href="/workspace"
              className="rounded-2xl border border-slate-950 bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Đăng nhập
            </Link>
            <Link
              href="/workspace"
              className="rounded-2xl border border-slate-950 bg-amber-300 px-5 py-3 text-center text-sm font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-0.5"
            >
              Dùng bản demo
            </Link>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Chưa có tài khoản? <span className="font-black text-slate-950">Tạo hồ sơ học đầu tư</span>
          </p>

          <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Lưu ý:</strong> Hệ thống không đưa ra khuyến nghị mua, bán hoặc nắm giữ cổ phiếu. Nội dung chỉ phục vụ học tập, phân tích và tham khảo.
          </div>
        </aside>
      </section>
    </main>
  );
}
