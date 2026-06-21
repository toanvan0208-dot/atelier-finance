"use client";

import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PortfolioReadinessItem, PortfolioReadinessResult, PortfolioReadinessStatus } from "../lib/load-portfolio-readiness";

type PortfolioReadinessPanelProps = {
  data?: PortfolioReadinessResult | null;
};

const statusVariant: Record<PortfolioReadinessStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  insufficient_data: "warning",
  partial: "warning",
  unavailable: "neutral",
};

const valueOrUnavailable = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === "" ? "unavailable" : String(value);

const blockedMetricLabel = (metric: string): string =>
  metric
    .replace(":", " blocked by ")
    .replaceAll("_", " ");

function ReadinessRow({ item }: { item: PortfolioReadinessItem }) {
  const missingInputs = item.missingInputs.length ? item.missingInputs.join(", ") : "none";
  const blockedMetrics = item.blockedMetrics.length
    ? item.blockedMetrics.map(blockedMetricLabel).join("; ")
    : "none";

  return (
    <article className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">{item.ticker}</p>
          <p className="text-xs leading-5 text-muted">
            {item.companyName ?? "Company metadata unavailable"} · {item.exchange ?? "exchange unavailable"} ·{" "}
            {item.industry ?? "industry unavailable"}
          </p>
        </div>
        <Chip size="sm" variant={statusVariant[item.financials.status]}>
          Financials {item.financials.status}
        </Chip>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Company metadata</p>
          <p className="mt-1 text-xs font-semibold text-ink">{item.companyMetadata.status}</p>
          <p className="text-[11px] leading-5 text-muted">
            {item.companyMetadata.sourceLabel} · {item.companyMetadata.dataMode} · productionApproved:false
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Technical/PVT</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.technical.provider} · {item.technical.status}
          </p>
          <p className="text-[11px] leading-5 text-muted">
            VNStock research candidate · {item.technical.sourceLabel} · fallbackUsed:{String(item.technical.fallbackUsed)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Financials</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.financials.runtimeStatus} · {item.financials.readPath}
          </p>
          <p className="text-[11px] leading-5 text-muted">
            controlled local/research · {item.financials.sourceLabel} · fallbackUsed:{String(item.financials.fallbackUsed)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">sharesOutstanding</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.sharesOutstanding.status} · {valueOrUnavailable(item.sharesOutstanding.value)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">EPS</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.eps.status} · {valueOrUnavailable(item.eps.value)}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Valuation readiness</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.valuation.status} · canClaimValuationDbBacked:false
          </p>
          <p className="text-[11px] leading-5 text-muted">
            P/E:{item.valuation.pe} · marketCap:{item.valuation.marketCap} · P/B:{item.valuation.pb}
          </p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
          <p className="text-[11px] font-bold text-subtle">Risk readiness</p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {item.risk.status} · canClaimRiskDbBacked:false
          </p>
          <p className="text-[11px] leading-5 text-muted">
            source:{item.risk.sourceMode} · leverage:{item.risk.leverageRisk}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <p className="rounded-[3px] border border-border-soft bg-surface px-2 py-2 text-[11px] leading-5 text-muted">
          <span className="font-bold text-ink">Missing inputs:</span> {missingInputs}
        </p>
        <p className="rounded-[3px] border border-border-soft bg-surface px-2 py-2 text-[11px] leading-5 text-muted">
          <span className="font-bold text-ink">Blocked metrics:</span> {blockedMetrics}
        </p>
      </div>
    </article>
  );
}

export function PortfolioReadinessPanel({ data }: PortfolioReadinessPanelProps) {
  if (!data) return null;

  return (
    <Card className="border-border">
      <CardHeader
        chip={<Chip variant="warning">productionApproved:false</Chip>}
        description="Derived status for FPT/MWG/VNM from company metadata, Technical/PVT, and Financials runtimes. This layer is not a new source of financial truth."
        icon="PR"
        title="Portfolio readiness backbone"
      />
      <CardBody className="space-y-3">
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          Technical/PVT uses VNStock research candidate data when DB-backed. Financials uses controlled local/research
          data. sharesOutstanding and EPS remain unavailable unless a traceable source is added later.
        </div>
        <div className="grid gap-3">
          {data.tickers.map((item) => (
            <ReadinessRow key={item.ticker} item={item} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
