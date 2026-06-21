import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ControlledValuationMetricStatus } from "../lib/controlled-valuation-calculation";
import type { ControlledValuationIntegrationBoundary } from "../lib/controlled-valuation-integration-boundary";

type ControlledValuationCalculationPanelProps = {
  boundary: ControlledValuationIntegrationBoundary;
};

type MetricRow = {
  key: string;
  label: string;
  status: ControlledValuationMetricStatus;
  value: number | null;
  reason: string;
};

const statusVariant: Record<ControlledValuationMetricStatus, "success" | "warning" | "danger" | "neutral"> = {
  blocked: "neutral",
  insufficient_data: "warning",
  not_applicable: "neutral",
  ready: "success",
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return "unavailable";

  const maximumFractionDigits = Math.abs(value) > 0 && Math.abs(value) < 1 ? 6 : 2;
  const formatted = value.toLocaleString("en-US", { maximumFractionDigits });

  return formatted === "0" && value !== 0 ? value.toPrecision(4) : formatted;
};

const readableReason = (reason: string): string => reason.replace(/_/g, " ");

const metricRows = (boundary: ControlledValuationIntegrationBoundary): MetricRow[] => [
  {
    key: "marketCap",
    label: "marketCap",
    status: boundary.calculation.metrics.marketCap.status,
    value: boundary.calculation.metrics.marketCap.value,
    reason: boundary.calculation.metrics.marketCap.reason,
  },
  {
    key: "pe",
    label: "P/E",
    status: boundary.calculation.metrics.pe.status,
    value: boundary.calculation.metrics.pe.value,
    reason: boundary.calculation.metrics.pe.reason,
  },
  {
    key: "bvps",
    label: "BVPS",
    status: boundary.calculation.metrics.bvps.status,
    value: boundary.calculation.metrics.bvps.value,
    reason: boundary.calculation.metrics.bvps.reason,
  },
  {
    key: "pb",
    label: "P/B",
    status: boundary.calculation.metrics.pb.status,
    value: boundary.calculation.metrics.pb.value,
    reason: boundary.calculation.metrics.pb.reason,
  },
  {
    key: "ps",
    label: "P/S",
    status: boundary.calculation.metrics.ps.status,
    value: boundary.calculation.metrics.ps.value,
    reason: boundary.calculation.metrics.ps.reason,
  },
  {
    key: "ev",
    label: "EV",
    status: boundary.calculation.blockedMetrics.ev.status,
    value: boundary.calculation.blockedMetrics.ev.value,
    reason: boundary.calculation.blockedMetrics.ev.reason,
  },
  {
    key: "evToEbitda",
    label: "EV/EBITDA",
    status: boundary.calculation.blockedMetrics.evToEbitda.status,
    value: boundary.calculation.blockedMetrics.evToEbitda.value,
    reason: boundary.calculation.blockedMetrics.evToEbitda.reason,
  },
  {
    key: "dcf",
    label: "DCF",
    status: boundary.calculation.blockedMetrics.dcf.status,
    value: boundary.calculation.blockedMetrics.dcf.value,
    reason: boundary.calculation.blockedMetrics.dcf.reason,
  },
  {
    key: "fairValueRange",
    label: "intrinsic value band",
    status: boundary.calculation.blockedMetrics.fairValueRange.status,
    value: boundary.calculation.blockedMetrics.fairValueRange.value,
    reason: boundary.calculation.blockedMetrics.fairValueRange.reason,
  },
];

export function ControlledValuationCalculationPanel({ boundary }: ControlledValuationCalculationPanelProps) {
  const rows = metricRows(boundary);

  return (
    <Card data-testid="controlled-valuation-calculation-panel">
      <CardHeader
        chip={<Chip variant="neutral">read-only</Chip>}
        description="Controlled metric status only. Values appear only when required inputs are valid."
        title="Controlled valuation calculation status"
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip variant="neutral">sourceMode:{boundary.sourceBoundary.valuationSourceMode}</Chip>
          <Chip variant="neutral">financialsSource:{boundary.sourceBoundary.financialsSourceMode}</Chip>
          <Chip variant="neutral">marketSource:{boundary.sourceBoundary.marketSourceMode}</Chip>
          <Chip variant="neutral">productionApproved:false</Chip>
          <Chip variant="neutral">canClaimValuationDbBacked:false</Chip>
          <Chip variant="neutral">controlled status</Chip>
        </div>
        <p className="text-xs leading-5 text-muted">
          This panel shows data readiness and blocked states only. It does not replace the persisted input bridge or
          provide an action instruction.
        </p>
        {boundary.sourceBoundary.warnings.length > 0 ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
            Boundary warnings: {boundary.sourceBoundary.warnings.slice(0, 5).join(" | ")}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3 font-bold">Metric</th>
                <th className="px-3 py-2 font-bold">Status</th>
                <th className="px-3 py-2 text-right font-bold">Value</th>
                <th className="py-2 pl-3 font-bold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-border-soft last:border-0" key={row.key}>
                  <td className="py-3 pr-3 font-bold text-ink">{row.label}</td>
                  <td className="px-3 py-3">
                    <Chip size="sm" variant={statusVariant[row.status]}>
                      {row.status}
                    </Chip>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {row.status === "ready" ? formatMetricValue(row.value) : "unavailable"}
                  </td>
                  <td className="py-3 pl-3 text-xs leading-5 text-muted">{readableReason(row.reason)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
