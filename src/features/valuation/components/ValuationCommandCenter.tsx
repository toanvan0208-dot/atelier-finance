"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  ValuationCommandCenterData,
  ValuationConfidence,
  ValuationMetric,
  ValuationMetricStatus,
  ValuationSensitivityItem,
  ValuationStatus,
} from "../types";

type ValuationCommandCenterProps = {
  data: ValuationCommandCenterData;
};

type DetailState =
  | { type: "range" }
  | { type: "metric"; metric: ValuationMetric }
  | { type: "sensitivity"; item: ValuationSensitivityItem }
  | null;

const statusLabel: Record<ValuationStatus, string> = {
  undervalued: "Dưới vùng tham khảo",
  within_range: "Trong vùng tham khảo",
  overvalued: "Trên vùng tham khảo",
  unclear: "Dữ liệu trái chiều",
  insufficient_data: "Chưa đủ dữ liệu",
};

const confidenceLabel: Record<ValuationConfidence, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  unknown: "Chưa rõ",
};

const metricLabel: Record<ValuationMetricStatus, string> = {
  reasonable: "Hợp lý",
  watch: "Cần theo dõi",
  risk: "Rủi ro",
  neutral: "Trung tính",
  missing: "Chưa đủ dữ liệu",
};

const metricVariant: Record<ValuationMetricStatus, "success" | "warning" | "danger" | "neutral"> = {
  reasonable: "success",
  watch: "warning",
  risk: "danger",
  neutral: "neutral",
  missing: "neutral",
};

const sensitivityVariant: Record<ValuationSensitivityItem["sensitivity"], "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const sensitivityLabel: Record<ValuationSensitivityItem["sensitivity"], string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

function pct(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

function ValuationRangeVisual({ data }: { data: ValuationCommandCenterData }) {
  const { bear, base, bull, market, maxDomain, minDomain, referenceMax, referenceMin } = data.range;
  const span = maxDomain - minDomain;
  const referenceLeft = pct(referenceMin, minDomain, maxDomain);
  const referenceWidth = ((referenceMax - referenceMin) / span) * 100;

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <div className="relative h-24">
        <div className="absolute left-0 right-0 top-11 h-3 rounded-[3px] bg-surface-soft" />
        <div
          className="absolute top-10 h-5 rounded-[3px] border border-border bg-accent/60"
          style={{ left: `${referenceLeft}%`, width: `${referenceWidth}%` }}
        />
        {[
          { label: "Xấu", value: bear, tone: "text-warning" },
          { label: "Cơ sở", value: base, tone: "text-accent" },
          { label: "Tốt", value: bull, tone: "text-success" },
        ].map((point) => (
          <div key={point.label} className="absolute top-2 -translate-x-1/2 text-center" style={{ left: `${pct(point.value, minDomain, maxDomain)}%` }}>
            <div className={`text-xs font-bold ${point.tone}`}>{point.label}</div>
            <div className="mt-1 h-10 w-px bg-border" />
            <div className="text-[11px] font-bold text-ink">{point.value}k</div>
          </div>
        ))}
        <div className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pct(market, minDomain, maxDomain)}%` }}>
          <div className="rounded-[3px] border border-border bg-ink px-2 py-1 text-[11px] font-bold text-white">Giá hiện tại {market}k</div>
          <div className="mx-auto h-14 w-[2px] bg-ink" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted">
        <span>{minDomain}k</span>
        <span>Vùng tham khảo: {data.referenceRange}</span>
        <span>{maxDomain}k</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        Vùng giá thay đổi khi giả định lợi nhuận, tăng trưởng hoặc chiết khấu thay đổi.
      </p>
    </div>
  );
}

export function ValuationCommandCenter({ data }: ValuationCommandCenterProps) {
  const [detail, setDetail] = useState<DetailState>(null);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.45fr]">
        <Card className="border-border">
          <CardHeader
            chip={data.isMock ? <Chip size="sm" variant="neutral">Mock data</Chip> : null}
            description={`${data.ticker} · ${data.companyName}`}
            icon="VC"
            title={data.title}
          />
          <CardBody className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase text-subtle">Giá hiện tại</p>
              <p className="mt-1 font-brand text-3xl font-bold text-ink">{data.currentPrice}</p>
            </div>
            <div className="grid gap-2">
              <div className="rounded-[4px] bg-surface-soft px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">Vùng tham khảo</p>
                <p className="text-sm font-bold text-ink">{data.referenceRange}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[4px] bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">Trạng thái</p>
                  <p className="text-sm font-bold text-ink">{statusLabel[data.status]}</p>
                </div>
                <div className="rounded-[4px] bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">Biên an toàn</p>
                  <p className="text-sm font-bold text-ink">{data.marginOfSafety}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[4px] bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">Độ tin cậy</p>
                  <p className="text-sm font-bold text-ink">{confidenceLabel[data.confidence]}</p>
                </div>
                <div className="rounded-[4px] bg-surface-soft px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">Phương pháp chính</p>
                  <p className="text-sm font-bold text-ink">{data.primaryMethod}</p>
                </div>
              </div>
            </div>
            <p className="text-sm font-bold leading-6 text-ink">{data.summary}</p>
            <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.warning}</p>
          </CardBody>
        </Card>

        <Card className="border-border">
          <CardHeader
            action={<Button size="sm" variant="secondary" onClick={() => setDetail({ type: "range" })}>Cách đọc vùng giá</Button>}
            description="Giá hiện tại phải được đọc cùng vùng xấu, cơ sở và tốt."
            icon="R"
            title="Valuation Range Chart"
          />
          <CardBody>
            <ValuationRangeVisual data={data} />
          </CardBody>
        </Card>
      </div>

      <Card className="border-border-soft">
        <CardHeader description="Các số liệu chính để đọc nhanh định giá và giả định." icon="M" title="Key Valuation Metrics" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setDetail({ type: "metric", metric })}
                className="min-h-[142px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                  {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
                </div>
                <p className="mt-2 font-brand text-2xl font-bold text-ink">
                  {metric.value}{metric.unit ? <span className="ml-1 text-sm">{metric.unit}</span> : null}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-muted">{metric.period}</p>
                <Chip className="mt-2" size="sm" variant={metricVariant[metric.status]}>{metricLabel[metric.status]}</Chip>
                <p className="mt-2 text-xs leading-5 text-muted">{metric.explanation}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border-soft">
          <CardHeader icon="S" title="Giả định nào làm định giá thay đổi mạnh nhất?" description="Mock sensitivity, cần thay bằng mô hình thật khi có backend." />
          <CardBody className="grid gap-2 md:grid-cols-3">
            {data.sensitivity.map((item) => (
              <button key={item.id} type="button" onClick={() => setDetail({ type: "sensitivity", item })} className="rounded-[4px] bg-surface-soft px-3 py-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{item.name}</p>
                  <Chip size="sm" variant={sensitivityVariant[item.sensitivity]}>{sensitivityLabel[item.sensitivity]}</Chip>
                </div>
                <p className="mt-1 text-xs font-bold text-muted">{item.currentValue}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{item.impact}</p>
              </button>
            ))}
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader icon="N" title={data.nextCheckpoint.title} />
          <CardBody>
            <p className="text-sm leading-6 text-muted">{data.nextCheckpoint.description}</p>
            <Button className="mt-3" size="sm" variant="secondary">{data.nextCheckpoint.ctaLabel}</Button>
          </CardBody>
        </Card>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">
                {detail.type === "range" ? "Cách đọc vùng giá" : detail.type === "metric" ? `Chi tiết: ${detail.metric.label}` : `Chi tiết giả định: ${detail.item.name}`}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              {detail.type === "range" ? (
                <>
                  <p className="text-sm leading-6 text-muted">Vùng giá là khoảng tham khảo được tạo từ nhiều phương pháp và kịch bản, không phải một con số chắc chắn.</p>
                  <p className="text-sm leading-6 text-muted">Giá hiện tại nằm trong vùng nghĩa là thị trường đang trả gần mức giả định cơ sở, chưa nói lên hành động giao dịch.</p>
                  <p className="text-sm leading-6 text-muted">Biên an toàn là khoảng đệm khi giá hiện tại thấp hơn đáng kể so với kịch bản thận trọng.</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.warning}</p>
                </>
              ) : detail.type === "metric" ? (
                <>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Chỉ số này là gì?</strong> {detail.metric.detail?.definition}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Vì sao quan trọng?</strong> {detail.metric.detail?.whyItMatters}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Mức hiện tại:</strong> {detail.metric.explanation}</p>
                  <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">Sai lầm thường gặp: {detail.metric.detail?.commonMistake}</p>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Giá trị hiện tại:</strong> {detail.item.currentValue}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Tác động:</strong> {detail.item.impact}</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">Giả định nhạy cao cần được viết rõ trong ghi chú định giá, không nên ẩn trong kết quả cuối.</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
