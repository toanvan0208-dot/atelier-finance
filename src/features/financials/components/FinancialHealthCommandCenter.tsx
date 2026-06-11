"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  FinancialCoreMetric,
  FinancialHealthCommandCenterData,
  FinancialMetricStatus,
  FinancialWarningSignal,
} from "../types";

type FinancialHealthCommandCenterProps = {
  data: FinancialHealthCommandCenterData;
};

type DetailState =
  | { type: "dashboard" }
  | { type: "metric"; metric: FinancialCoreMetric }
  | { type: "readiness" }
  | null;

const metricStatusLabel: Record<FinancialMetricStatus, string> = {
  good: "Tốt sơ bộ",
  watch: "Cần theo dõi",
  risk: "Rủi ro",
  neutral: "Trung tính",
  unknown: "Chưa đủ dữ liệu",
};

const metricStatusVariant: Record<FinancialMetricStatus, "success" | "warning" | "danger" | "neutral"> = {
  good: "success",
  watch: "warning",
  risk: "danger",
  neutral: "neutral",
  unknown: "neutral",
};

const severityVariant: Record<FinancialWarningSignal["severity"], "neutral" | "warning" | "danger"> = {
  light: "neutral",
  watch: "warning",
  serious: "danger",
};

const severityLabel: Record<FinancialWarningSignal["severity"], string> = {
  light: "Nhẹ",
  watch: "Cần theo dõi",
  serious: "Nghiêm trọng",
};

function scrollToBlock(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function FinancialHealthCommandCenter({ data }: FinancialHealthCommandCenterProps) {
  const [detail, setDetail] = useState<DetailState>(null);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
        <Card className="border-border bg-surface">
          <CardHeader
            action={<Button size="sm" variant="secondary" onClick={() => setDetail({ type: "dashboard" })}>Cách đọc</Button>}
            chip={data.isMock ? <Chip size="sm" variant="neutral">Mock data</Chip> : null}
            description={`${data.ticker} · ${data.companyName} · ${data.period}`}
            icon="FH"
            title={data.title}
          />
          <CardBody>
            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase text-subtle">Sức khỏe tài chính</p>
                <p className="mt-1 font-brand text-2xl font-bold text-ink">{data.healthStatus}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{data.conclusion}</p>
              </div>
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-subtle">Financial Health Score</p>
                    <p className="mt-1 font-brand text-3xl font-bold text-ink">{data.score}/100</p>
                  </div>
                  <Chip variant="warning">{data.healthStatus}</Chip>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-[3px] border border-border bg-surface-soft">
                  <div className="h-full bg-accent" style={{ width: `${data.score}%` }} />
                </div>
                <p className="mt-3 rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
                  {data.warning}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader
            action={<Button size="sm" variant="ghost" onClick={() => setDetail({ type: "readiness" })}>Vì sao?</Button>}
            icon="V"
            title="Readiness sang Định giá"
          />
          <CardBody>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-brand text-2xl font-bold text-ink">
                  {data.valuationReadinessSummary.completed}/{data.valuationReadinessSummary.total}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">điều kiện đã hoàn thành</p>
              </div>
              <Chip variant="warning">{data.valuationReadinessSummary.status}</Chip>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-[3px] bg-surface-soft">
              <div
                className="h-full bg-accent"
                style={{ width: `${(data.valuationReadinessSummary.completed / data.valuationReadinessSummary.total) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">{data.valuationReadinessSummary.helperText}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="border-border-soft">
        <CardHeader description="Các số liệu lõi để nhìn nhanh doanh thu, lợi nhuận, dòng tiền, nợ và vốn." icon="M" title="Core Financial Metrics" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {data.metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setDetail({ type: "metric", metric })}
                className="min-h-[154px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                  {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
                </div>
                <p className="mt-2 font-brand text-2xl font-bold text-ink">
                  {metric.value}{metric.unit ? <span className="ml-1 text-sm">{metric.unit}</span> : null}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted">{metric.period}</span>
                  {metric.change ? <span className="text-[11px] font-bold text-ink">{metric.change}</span> : null}
                </div>
                <Chip className="mt-2" size="sm" variant={metricStatusVariant[metric.status]}>{metricStatusLabel[metric.status]}</Chip>
                <p className="mt-2 text-xs leading-5 text-muted">{metric.explanation}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-border-soft">
          <CardHeader icon="!" title="Main Warning Signals" description="Tóm tắt cảnh báo chính, không thay thế phần kiểm tra sâu." />
          <CardBody className="space-y-2">
            {data.warningSignals.map((signal) => (
              <div key={signal.id} className="flex flex-col gap-2 rounded-[4px] bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink">{signal.title}</p>
                    <Chip size="sm" variant={severityVariant[signal.severity]}>{severityLabel[signal.severity]}</Chip>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{signal.explanation}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => scrollToBlock(signal.targetBlockId)}>{signal.ctaLabel}</Button>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader icon="P" title="Nên đọc sâu phần nào trước?" description="Ưu tiên dựa trên các cảnh báo đang nổi bật." />
          <CardBody className="space-y-2">
            {data.priorityReadingPath.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToBlock(item.targetBlockId)}
                className="w-full rounded-[4px] bg-surface-soft px-3 py-3 text-left transition hover:bg-surface-hover"
              >
                <p className="text-[11px] font-bold uppercase text-accent">{item.priority}</p>
                <p className="mt-1 text-sm font-bold text-ink">{item.target}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">
                {detail.type === "metric" ? `Chi tiết: ${detail.metric.label}` : detail.type === "readiness" ? "Vì sao chưa nên sang định giá ngay?" : "Cách đọc dashboard BCTC"}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              {detail.type === "metric" ? (
                <>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Chỉ số này là gì?</strong> {detail.metric.detail?.definition}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Vì sao quan trọng?</strong> {detail.metric.detail?.whyItMatters}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Mức hiện tại:</strong> {detail.metric.explanation}</p>
                  <p className="text-sm leading-6 text-muted"><strong className="text-ink">Liên quan:</strong> {detail.metric.detail?.relatedStatement}</p>
                  <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">Sai lầm thường gặp: {detail.metric.detail?.commonMistake}</p>
                </>
              ) : detail.type === "readiness" ? (
                <>
                  <p className="text-sm leading-6 text-muted">Định giá cần giả định doanh thu, lợi nhuận, dòng tiền và rủi ro. Nếu chất lượng lợi nhuận chưa rõ, định giá rất dễ sai.</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.valuationReadinessSummary.helperText}</p>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-muted">Dashboard này chỉ là lớp đọc nhanh: xem trạng thái tổng quan, số liệu lõi, cảnh báo chính và thứ tự nên đọc sâu.</p>
                  <p className="text-sm leading-6 text-muted">Khi thấy cảnh báo ở dòng tiền, tồn kho hoặc nợ vay, hãy mở cụm phân tích tương ứng trước khi chuyển sang định giá.</p>
                  <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{data.warning}</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
