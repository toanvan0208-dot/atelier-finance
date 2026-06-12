import Link from "next/link";

const methodSteps = [
  {
    eyebrow: "Bước 01",
    title: "Đọc bối cảnh trước",
    description:
      "Không bắt đầu bằng cảm giác cổ phiếu đang rẻ. Hệ thống dẫn bạn đi từ thị trường, vĩ mô, ngành đến doanh nghiệp.",
  },
  {
    eyebrow: "Bước 02",
    title: "Kiểm chứng luận điểm",
    description:
      "Mỗi cổ phiếu được nhìn qua mô hình kinh doanh, báo cáo tài chính, định giá, dòng tiền và các điểm cần xác minh.",
  },
  {
    eyebrow: "Bước 03",
    title: "Ra quyết định có kỷ luật",
    description:
      "Trước khi hành động, bạn phải thấy rõ kịch bản mua, kịch bản sai, vùng rủi ro và việc cần theo dõi tiếp.",
  },
];

const modules = [
  "Vĩ mô",
  "Ngành",
  "Lọc cổ phiếu",
  "Doanh nghiệp",
  "Báo cáo tài chính",
  "Định giá",
  "Price Volume Time",
  "Rủi ro",
];

const thesisCards = [
  { label: "Luận điểm", value: "Tăng trưởng có điều kiện", note: "Cần xác nhận bằng doanh thu cùng cửa hàng và biên lợi nhuận." },
  { label: "Rủi ro", value: "Sức mua yếu", note: "Theo dõi hàng tồn kho, nợ vay ngắn hạn và áp lực cạnh tranh." },
  { label: "Hành động", value: "Chưa vội giải ngân", note: "Chờ vùng giá hợp lý hoặc tín hiệu dòng tiền rõ hơn." },
];

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#f5efe0] text-[#14202a]">
      <section className="relative isolate px-4 py-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_16%_18%,rgba(240,185,11,0.28),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.13),transparent_25%),linear-gradient(180deg,#fbf7ed_0%,#f5efe0_48%,#e9dfc8_100%)]" />
        <div className="absolute left-1/2 top-28 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-[#d8c8a6]/60 opacity-70" />
        <div className="absolute right-[-7rem] top-36 -z-10 h-72 w-72 rounded-full bg-[#13202a]/[0.04] blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[#d7c7a6] bg-[#fffaf0]/80 px-4 py-3 shadow-[0_18px_60px_rgba(20,32,42,0.08)] backdrop-blur-xl md:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Atelier Finance">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#14202a] font-brand text-xs font-black text-[#f0b90b]">
              AF
            </span>
            <span className="font-brand text-sm font-bold tracking-[-0.02em]">
              Atelier Finance
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#59636f] md:flex">
            <a href="#method" className="transition hover:text-[#14202a]">Phương pháp</a>
            <a href="#workspace" className="transition hover:text-[#14202a]">Workspace</a>
            <a href="#modules" className="transition hover:text-[#14202a]">Module</a>
          </nav>

          <Link
            href="/workspace"
            className="rounded-full bg-[#14202a] px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(20,32,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#24313c]"
          >
            Vào hệ thống
          </Link>
        </header>

        <div className="mx-auto max-w-7xl pb-16 pt-16 sm:pt-20 lg:pb-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7c7a6] bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#6f6043] shadow-[0_10px_34px_rgba(20,32,42,0.06)]">
              <span className="h-2 w-2 rounded-full bg-[#f0b90b]" />
              Workspace phân tích cổ phiếu Việt Nam
            </p>
            <h1 className="font-brand text-5xl font-black leading-[0.95] tracking-[-0.07em] text-[#111b24] sm:text-6xl lg:text-7xl">
              Phân tích cổ phiếu theo một quy trình rõ ràng.
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#5d6873] sm:text-lg">
              Atelier Finance giúp nhà đầu tư mới đi từ bối cảnh vĩ mô, ngành, doanh nghiệp, báo cáo tài chính, định giá đến rủi ro và kịch bản hành động — không nhảy thẳng vào mua bán theo cảm xúc.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/workspace"
                className="rounded-full bg-[#14202a] px-7 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(20,32,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#24313c]"
              >
                Bắt đầu phân tích
              </Link>
              <a
                href="#method"
                className="rounded-full border border-[#c9b890] bg-white/65 px-7 py-3.5 text-sm font-black text-[#14202a] shadow-[0_14px_34px_rgba(20,32,42,0.06)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Xem quy trình
              </a>
            </div>
          </div>

          <section id="workspace" className="relative mx-auto mt-14 max-w-6xl lg:mt-18">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[#14202a]/[0.04] blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-[#cdbd98] bg-[#fffaf0] shadow-[0_40px_120px_rgba(20,32,42,0.16)]">
              <div className="flex items-center justify-between border-b border-[#e2d4b8] bg-white/65 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e76f51]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f0b90b]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00a676]" />
                </div>
                <p className="hidden text-xs font-bold text-[#7a6d55] sm:block">atelier.finance / investment workspace</p>
                <span className="rounded-full bg-[#f3ead4] px-3 py-1 text-xs font-black text-[#5b4c2f]">MWG</span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="hidden border-r border-[#e2d4b8] bg-[#f8f0dc] p-5 lg:block">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#867653]">Luồng phân tích</p>
                  {modules.slice(0, 6).map((module, index) => (
                    <div
                      key={module}
                      className={`mb-2 flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold ${
                        index === 2 ? "bg-[#14202a] text-white shadow-[0_12px_32px_rgba(20,32,42,0.18)]" : "bg-white/55 text-[#44505b]"
                      }`}
                    >
                      <span>{module}</span>
                      <span className={index === 2 ? "text-[#f0b90b]" : "text-[#b49d6b]"}>0{index + 1}</span>
                    </div>
                  ))}
                </aside>

                <div className="p-5 sm:p-6 lg:p-7">
                  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#887858]">Bản nháp quyết định</p>
                      <h2 className="mt-2 font-brand text-3xl font-black tracking-[-0.04em] text-[#111b24] sm:text-4xl">
                        Có nên phân tích MWG tiếp không?
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-[#e2d4b8] bg-white/70 px-4 py-3 text-sm">
                      <p className="font-black text-[#111b24]">Trạng thái</p>
                      <p className="text-[#5d6873]">Đang kiểm chứng luận điểm</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {thesisCards.map((card) => (
                      <article key={card.label} className="rounded-3xl border border-[#dfd0ad] bg-white p-5 shadow-[0_14px_36px_rgba(20,32,42,0.06)]">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#948260]">{card.label}</p>
                        <h3 className="mt-3 font-brand text-xl font-black tracking-[-0.03em] text-[#111b24]">{card.value}</h3>
                        <p className="mt-3 text-sm leading-6 text-[#66727d]">{card.note}</p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-[#dfd0ad] bg-[#14202a] p-5 text-white shadow-[0_18px_50px_rgba(20,32,42,0.16)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f0d67a]">Chuỗi kiểm tra</p>
                          <h3 className="mt-2 font-brand text-2xl font-black tracking-[-0.04em]">Không bỏ qua tầng rủi ro</h3>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#f0d67a]">6/9 mục</span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {["Thị trường có ủng hộ không?", "Doanh nghiệp kiếm tiền bền không?", "Giá hiện tại đã có biên an toàn chưa?"].map((item) => (
                          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white/82">
                            <span className="h-2 w-2 rounded-full bg-[#f0b90b]" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-[#dfd0ad] bg-white p-5 shadow-[0_14px_36px_rgba(20,32,42,0.06)]">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#948260]">Ghi chú cho người mới</p>
                      <h3 className="mt-2 font-brand text-2xl font-black tracking-[-0.04em] text-[#111b24]">Bạn không cần đoán đúng ngay.</h3>
                      <p className="mt-3 text-sm leading-7 text-[#66727d]">
                        Điều quan trọng là biết mình đang thiếu dữ liệu nào, giả định nào có thể sai và khi nào nên dừng lại thay vì cố hợp lý hóa quyết định mua.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="method" className="border-y border-[#d8c8a6] bg-[#fffaf0]/75 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a7754]">Phương pháp</p>
            <h2 className="mt-3 font-brand text-4xl font-black tracking-[-0.05em] text-[#111b24] sm:text-5xl">
              Không phải thêm nhiều dữ liệu, mà là đặt dữ liệu vào đúng thứ tự.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {methodSteps.map((step) => (
              <article key={step.title} className="rounded-[1.75rem] border border-[#d8c8a6] bg-white/72 p-6 shadow-[0_16px_42px_rgba(20,32,42,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a875f]">{step.eyebrow}</p>
                <h3 className="mt-4 font-brand text-2xl font-black tracking-[-0.04em] text-[#111b24]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#66727d]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-[#d8c8a6] bg-[#14202a] p-6 text-white shadow-[0_24px_70px_rgba(20,32,42,0.18)] md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f0d67a]">Module chính</p>
            <h2 className="mt-2 font-brand text-3xl font-black tracking-[-0.05em]">Một workspace, một luồng phân tích.</h2>
          </div>
          <div className="flex max-w-2xl flex-wrap gap-2">
            {modules.map((module) => (
              <span key={module} className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-bold text-white/76">
                {module}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
