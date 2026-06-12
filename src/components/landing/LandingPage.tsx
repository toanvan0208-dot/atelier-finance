import Link from "next/link";

const investorSteps = [
  {
    label: "1",
    title: "Hiểu bối cảnh",
    description: "Đọc vĩ mô, ngành và trạng thái thị trường trước khi nhìn vào một mã cổ phiếu.",
  },
  {
    label: "2",
    title: "Lọc cơ hội",
    description: "Tách cổ phiếu đáng phân tích tiếp khỏi nhóm nhiễu bằng tiêu chí dễ hiểu.",
  },
  {
    label: "3",
    title: "Ra quyết định có kiểm soát",
    description: "Kết nối định giá, kỹ thuật, rủi ro và nhật ký để tránh mua theo cảm xúc.",
  },
];

const proofItems = ["Vĩ mô", "Ngành", "Doanh nghiệp", "BCTC", "Định giá", "Rủi ro"];

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#07111f] text-white">
      <section className="relative isolate min-h-dvh px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_0%,rgba(240,185,11,0.24),transparent_32%),radial-gradient(circle_at_20%_25%,rgba(0,166,118,0.18),transparent_30%),linear-gradient(180deg,#081326_0%,#07111f_52%,#050a13_100%)]" />
        <div className="absolute left-[-8rem] top-40 -z-10 h-72 w-72 rounded-full border-[34px] border-accent/25 blur-[1px]" />
        <div className="absolute right-[-10rem] top-56 -z-10 h-80 w-80 rounded-full border-[34px] border-white/10 blur-[1px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-black/45 to-transparent" />

        <header className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur md:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Atelier Finance">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-accent/60 bg-accent text-sm font-black text-ink shadow-hard-sm">
              AF
            </span>
            <span className="hidden font-brand text-sm font-semibold tracking-tight sm:block">
              Atelier Finance
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/72 md:flex">
            <a href="#method" className="transition hover:text-white">Phương pháp</a>
            <a href="#preview" className="transition hover:text-white">Giao diện</a>
            <a href="#modules" className="transition hover:text-white">Module</a>
          </nav>

          <Link
            href="/workspace"
            className="rounded-2xl border border-white/15 bg-white px-4 py-2 text-sm font-bold text-ink shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-accent"
          >
            Vào hệ thống
          </Link>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <section className="text-center lg:text-left">
            <p className="mx-auto mb-5 inline-flex rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-accent lg:mx-0">
              Hệ thống hỗ trợ đầu tư cho người mới
            </p>
            <h1 className="font-brand text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              Trước khi mua cổ phiếu, hãy hiểu vì sao mình mua.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg lg:mx-0">
              Atelier Finance biến quy trình phân tích cổ phiếu Việt Nam thành một workspace có dẫn dắt: đi từ vĩ mô, ngành, doanh nghiệp, báo cáo tài chính, định giá đến rủi ro và kịch bản hành động.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/workspace"
                className="rounded-2xl bg-accent px-6 py-3 text-sm font-black text-ink shadow-[0_18px_60px_rgba(240,185,11,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ffd84d]"
              >
                Mở workspace phân tích
              </Link>
              <a
                href="#preview"
                className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Xem giao diện mẫu
              </a>
            </div>
          </section>

          <section id="preview" className="relative mx-auto w-full max-w-3xl">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-accent/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#f7f1dd] text-ink shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 border-b border-ink/10 bg-white px-5 py-3">
                <span className="h-3 w-3 rounded-full bg-danger" />
                <span className="h-3 w-3 rounded-full bg-warning" />
                <span className="h-3 w-3 rounded-full bg-accent-green" />
                <span className="ml-3 text-xs font-semibold text-muted">atelier.finance/workspace</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5">
                <aside className="hidden rounded-3xl border border-ink/10 bg-white p-4 sm:block">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-subtle">Lộ trình</p>
                  {proofItems.slice(0, 5).map((item, index) => (
                    <div key={item} className="mb-2 flex items-center gap-2 rounded-2xl bg-surface-soft px-3 py-2 text-xs font-bold">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-ink">{index + 1}</span>
                      {item}
                    </div>
                  ))}
                </aside>
                <div className="space-y-4">
                  <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-subtle">Tổng quan cổ phiếu</p>
                        <h2 className="mt-1 font-brand text-2xl font-black tracking-tight">MWG có đáng phân tích tiếp?</h2>
                      </div>
                      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-black">Theo dõi</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {["Luận điểm", "Rủi ro", "Việc cần kiểm tra"].map((item) => (
                        <div key={item} className="rounded-2xl border border-border-soft bg-surface-soft p-3">
                          <p className="text-xs font-black text-muted">{item}</p>
                          <div className="mt-3 h-2 rounded-full bg-ink/10" />
                          <div className="mt-2 h-2 w-2/3 rounded-full bg-ink/10" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-ink/10 bg-white p-4">
                      <p className="text-xs font-black text-muted">Kịch bản hành động</p>
                      <p className="mt-2 text-sm font-semibold">Chỉ giải ngân khi luận điểm, định giá và rủi ro cùng ủng hộ.</p>
                    </div>
                    <div className="rounded-3xl border border-ink/10 bg-white p-4">
                      <p className="text-xs font-black text-muted">Cảnh báo thiên kiến</p>
                      <p className="mt-2 text-sm font-semibold">Không để cảm giác FOMO thay thế dữ liệu kiểm chứng.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section id="method" className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {investorSteps.map((step) => (
              <article key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-sm font-black text-ink">{step.label}</span>
                <h3 className="mt-4 font-brand text-xl font-black tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/68">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="modules" className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-7 text-sm font-bold text-white/62">
          {proofItems.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
              {item}
            </span>
          ))}
        </section>
      </section>
    </main>
  );
}
