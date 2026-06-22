"use client";

import { macroIndicators, macroNextChecks } from "../data/macroIndicators.data";
import {
  formatMacroIndicatorValue,
  macroIndicatorNeedsDataWarning,
  type MacroIndicator,
} from "../lib/macro-indicator-contract";

type MacroPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

const statusLabel: Record<MacroIndicator["status"], string> = {
  available: "Đã có dữ liệu",
  missing: "Chưa đủ dữ liệu",
  partial: "Dữ liệu một phần",
  sample: "Dữ liệu minh họa",
  stale: "Cần cập nhật",
};

function metadataText(label: string, value: string | null): string {
  return `${label}: ${value ?? "đang hoàn thiện"}`;
}

function MacroIndicatorCard({ indicator }: { indicator: MacroIndicator }) {
  const showWarning = macroIndicatorNeedsDataWarning(indicator);

  return (
    <article className="rounded-[8px] border-[1.5px] border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-muted">Chỉ báo vĩ mô</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">{indicator.name}</h2>
        </div>
        <span className="rounded-full border border-border-soft bg-surface-soft px-3 py-1 text-xs font-bold text-muted">
          {statusLabel[indicator.status]}
        </span>
      </div>

      <p className="mt-4 text-2xl font-black text-ink">{formatMacroIndicatorValue(indicator)}</p>

      <dl className="mt-3 grid gap-1 text-xs font-semibold leading-5 text-muted sm:grid-cols-3">
        <div>
          <dt className="sr-only">Kỳ dữ liệu</dt>
          <dd>{metadataText("Kỳ dữ liệu", indicator.period)}</dd>
        </div>
        <div>
          <dt className="sr-only">Nguồn</dt>
          <dd>{metadataText("Nguồn", indicator.sourceLabel ?? indicator.sourceName)}</dd>
        </div>
        <div>
          <dt className="sr-only">Mốc cập nhật</dt>
          <dd>{metadataText("Cập nhật", indicator.asOf)}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4 text-sm leading-6">
        <section>
          <h3 className="font-extrabold text-ink">Hiểu chỉ báo</h3>
          <p className="mt-1 text-muted">{indicator.explanationForBeginner}</p>
        </section>
        <section>
          <h3 className="font-extrabold text-ink">Vì sao quan trọng?</h3>
          <p className="mt-1 text-muted">{indicator.whyItMatters}</p>
        </section>
        <section>
          <h3 className="font-extrabold text-ink">Cần xem tiếp gì?</h3>
          <p className="mt-1 text-muted">{indicator.whatToCheckNext}</p>
        </section>
      </div>

      {showWarning ? (
        <div className="mt-5 rounded-[5px] border border-warning/40 bg-warning/10 px-3 py-3 text-xs font-semibold leading-5 text-muted">
          <p className="font-extrabold text-ink">Trạng thái dữ liệu</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {indicator.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function MacroPage(_props: MacroPageProps) {
  void _props;

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-7">
      <header className="rounded-[8px] border-[1.5px] border-border bg-surface p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-muted">Luồng 2 · Bước 1</p>
        <h1 className="mt-1 font-brand text-2xl font-bold text-ink sm:text-3xl">Bước 1 — Bối cảnh vĩ mô</h1>
        <p className="mt-2 max-w-[820px] text-sm leading-7 text-muted">
          Xem các yếu tố kinh tế chung như tăng trưởng, lạm phát, lãi suất và tỷ giá trước khi phân tích ngành và
          doanh nghiệp. Phần này giúp đặt bối cảnh, không phải khuyến nghị đầu tư.
        </p>
        <p className="mt-4 rounded-[5px] border border-border-soft bg-accent-soft/60 px-4 py-3 text-sm font-semibold leading-6 text-ink">
          Hiện chưa có bản ghi vĩ mô đã rà soát. Các giá trị thiếu được giữ là chưa đủ dữ liệu, không thay bằng 0.
        </p>
      </header>

      <main className="space-y-7">
        <section aria-label="Bốn chỉ báo vĩ mô chính" className="grid gap-4 lg:grid-cols-2">
          {macroIndicators.map((indicator) => (
            <MacroIndicatorCard indicator={indicator} key={indicator.indicatorKey} />
          ))}
        </section>

        <section className="rounded-[8px] border-[1.5px] border-border bg-surface p-5 shadow-soft">
          <h2 className="text-xl font-extrabold text-ink">Từ vĩ mô, nên kiểm tra tiếp gì?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Dùng các câu hỏi này để nối bối cảnh chung sang phân tích ngành và doanh nghiệp.
          </p>
          <ul className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-ink md:grid-cols-2">
            {macroNextChecks.map((check) => (
              <li className="rounded-[5px] border border-border-soft bg-surface-soft px-4 py-3" key={check}>
                {check}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
