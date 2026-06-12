"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  BusinessDashboardData,
  BusinessMetricStatus,
  BusinessMoneyMachineNode,
  BusinessOperatingMetric,
} from "../types";

type BusinessUnderstandingDashboardProps = {
  data: BusinessDashboardData;
  canGoToFinancials: boolean;
  onNavigate?: (moduleKey: string) => void;
};

type DetailState =
  | { type: "node"; node: BusinessMoneyMachineNode }
  | { type: "metric"; metric: BusinessOperatingMetric }
  | null;

function statusTone(status: BusinessMetricStatus) {
  if (status === "good") return "success";
  if (status === "watch") return "warning";
  if (status === "risk") return "danger";
  return "neutral";
}

function readinessTone(status: BusinessDashboardData["readiness"][number]["status"]) {
  if (status === "done") return "success";
  if (status === "needs_check") return "warning";
  return "neutral";
}

export function BusinessUnderstandingDashboard({
  canGoToFinancials,
  data,
  onNavigate,
}: BusinessUnderstandingDashboardProps) {
  const [detail, setDetail] = useState<DetailState>(null);
  const doneReadiness = data.readiness.filter((item) => item.status === "done").length;
  const readinessTotal = data.readiness.length;

  return (
    <section className="space-y-4">
      <Card className="border-border-soft">
        <CardHeader
          icon="MM"
          title="Money Machine"
          description="Doanh nghiệp tạo tiền qua những khâu nào."
        />
        <CardBody>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {data.moneyMachine.map((node, index) => (
              <div key={node.id} className="flex min-w-[168px] items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setDetail({ type: "node", node })}
                  className="w-full rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
                >
                  <p className="font-mono text-[11px] font-bold text-subtle">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{node.label}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{node.description}</p>
                  <p className="mt-2 text-[11px] font-semibold text-subtle">{node.relatedMetrics.slice(0, 2).join(" · ")}</p>
                </button>
                {index < data.moneyMachine.length - 1 ? <span className="hidden self-center text-lg font-bold text-subtle lg:block">→</span> : null}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="border-border-soft">
        <CardHeader icon="OP" title="Chỉ số vận hành cần nhìn trước" description="Mock data, cần thay bằng API thật khi nối dữ liệu." />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.operatingMetrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setDetail({ type: "metric", metric })}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-left transition hover:border-border hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase text-subtle">{metric.label}</p>
                  {metric.isMock ? <Chip size="sm" variant="neutral">Mock</Chip> : null}
                </div>
                <p className="mt-2 text-xl font-bold text-ink">{metric.value}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted">{metric.period}</p>
                  <Chip size="sm" variant={statusTone(metric.status)}>{metric.status}</Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{metric.explanation}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <Card className="border-border-soft">
          <CardHeader icon="+" title="Điều có thể là lợi thế" />
          <CardBody className="space-y-2">
            {data.advantages.map((item) => (
              <div key={item.title} className="rounded-[4px] bg-surface-soft px-3 py-2">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                <Chip className="mt-2" size="sm" variant="neutral">{item.module}</Chip>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader icon="!" title="Điều cần kiểm chứng" />
          <CardBody className="space-y-2">
            {data.risks.map((item) => (
              <div key={item.title} className="rounded-[4px] bg-surface-soft px-3 py-2">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                <Chip className="mt-2" size="sm" variant="warning">{item.module}</Chip>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border-border-soft">
          <CardHeader icon="B" title="Đã đủ điều kiện sang BCTC chưa?" description={`${doneReadiness}/${readinessTotal} điều kiện đã rõ.`} />
          <CardBody className="space-y-3">
            {data.readiness.map((item) => (
              <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{item.label}</p>
                  <Chip size="sm" variant={readinessTone(item.status)}>{item.status}</Chip>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{item.helperText}</p>
              </div>
            ))}
            <Button
              size="sm"
              variant={canGoToFinancials ? "primary" : "secondary"}
              disabled={!canGoToFinancials}
              onClick={() => onNavigate?.("financials")}
            >
              {canGoToFinancials ? "Chuyển sang BCTC" : "Bổ sung điều kiện còn thiếu"}
            </Button>
          </CardBody>
        </Card>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
          <div className="max-h-[92dvh] w-full max-w-[720px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">
                {detail.type === "node" ? detail.node.label : detail.metric.label}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              {detail.type === "node" ? (
                <>
                  <p className="text-sm leading-6 text-muted">{detail.node.description}</p>
                  <div className="flex flex-wrap gap-2">{detail.node.bctcChecks.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}</div>
                  {detail.node.riskNote ? <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">{detail.node.riskNote}</p> : null}
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-muted">{detail.metric.detail.definition}</p>
                  <p className="text-sm leading-6 text-muted">{detail.metric.detail.whyItMatters}</p>
                  <div className="flex flex-wrap gap-2">{detail.metric.detail.bctcCheck.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}</div>
                  <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">Sai lầm thường gặp: {detail.metric.detail.commonMistake}</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
