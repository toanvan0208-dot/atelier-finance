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
  requiredInputs: string[];
  missingInputs: string[];
};

type InputRow = {
  key: string;
  label: string;
  source: string;
  unit: string;
  status: string;
  warning: string;
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

const readableReasonMap: Record<string, string> = {
  blocked_no_dcf_wacc_in_phase_59: "Blocked: DCF inputs and WACC are outside the current safe scope.",
  blocked_no_intrinsic_value_band_in_phase_59:
    "Blocked: intrinsic value band is outside the current safe scope.",
  blocked_until_ebitda_source_is_explicit: "Blocked: EBITDA source is not explicit.",
  blocked_until_explicit_ev_inputs: "Blocked: EV inputs are not explicit.",
  bvps_not_ready: "Not enough input data: BVPS is not ready.",
  eps_non_positive: "Not applicable with current data: EPS is non-positive.",
  equity_non_positive: "Not applicable with current data: equity is non-positive.",
  market_cap_not_ready: "Not enough input data: market cap is not ready.",
  missing_eps: "Missing input data: EPS is unavailable.",
  missing_equity: "Missing input data: equity is unavailable.",
  missing_revenue: "Missing input data: revenue is unavailable.",
  missing_valid_market_price: "Missing input data: valid market price is unavailable.",
  missing_valid_market_price_or_shares: "Missing input data: valid market price or shares are unavailable.",
  missing_valid_shares: "Missing input data: valid shares outstanding is unavailable.",
  ready: "Ready: required inputs are valid for this controlled metric.",
  ready_from_direct_market_cap: "Ready: direct market cap input is available.",
  ready_from_market_price_and_shares: "Ready: market price and shares are available.",
};

const statusExplanation: Record<ControlledValuationMetricStatus, string> = {
  blocked: "Blocked by current Valuation guardrails.",
  insufficient_data: "Chua du co so de tinh.",
  not_applicable: "Khong ap dung voi du lieu hien tai.",
  ready: "Ready for controlled display.",
};

const readableReason = (reason: string): string => readableReasonMap[reason] ?? reason.replace(/_/g, " ");

const readableWarning = (warning: string): string => warning.replace(/_/g, " ");

const metricRows = (boundary: ControlledValuationIntegrationBoundary): MetricRow[] => [
  {
    key: "marketCap",
    label: "marketCap",
    status: boundary.calculation.metrics.marketCap.status,
    value: boundary.calculation.metrics.marketCap.value,
    reason: boundary.calculation.metrics.marketCap.reason,
    requiredInputs: boundary.calculation.metrics.marketCap.requiredInputs,
    missingInputs: boundary.calculation.metrics.marketCap.missingInputs,
  },
  {
    key: "pe",
    label: "P/E",
    status: boundary.calculation.metrics.pe.status,
    value: boundary.calculation.metrics.pe.value,
    reason: boundary.calculation.metrics.pe.reason,
    requiredInputs: boundary.calculation.metrics.pe.requiredInputs,
    missingInputs: boundary.calculation.metrics.pe.missingInputs,
  },
  {
    key: "bvps",
    label: "BVPS",
    status: boundary.calculation.metrics.bvps.status,
    value: boundary.calculation.metrics.bvps.value,
    reason: boundary.calculation.metrics.bvps.reason,
    requiredInputs: boundary.calculation.metrics.bvps.requiredInputs,
    missingInputs: boundary.calculation.metrics.bvps.missingInputs,
  },
  {
    key: "pb",
    label: "P/B",
    status: boundary.calculation.metrics.pb.status,
    value: boundary.calculation.metrics.pb.value,
    reason: boundary.calculation.metrics.pb.reason,
    requiredInputs: boundary.calculation.metrics.pb.requiredInputs,
    missingInputs: boundary.calculation.metrics.pb.missingInputs,
  },
  {
    key: "ps",
    label: "P/S",
    status: boundary.calculation.metrics.ps.status,
    value: boundary.calculation.metrics.ps.value,
    reason: boundary.calculation.metrics.ps.reason,
    requiredInputs: boundary.calculation.metrics.ps.requiredInputs,
    missingInputs: boundary.calculation.metrics.ps.missingInputs,
  },
  {
    key: "ev",
    label: "EV",
    status: boundary.calculation.blockedMetrics.ev.status,
    value: boundary.calculation.blockedMetrics.ev.value,
    reason: boundary.calculation.blockedMetrics.ev.reason,
    requiredInputs: boundary.calculation.blockedMetrics.ev.requiredInputs,
    missingInputs: boundary.calculation.blockedMetrics.ev.missingInputs,
  },
  {
    key: "evToEbitda",
    label: "EV/EBITDA",
    status: boundary.calculation.blockedMetrics.evToEbitda.status,
    value: boundary.calculation.blockedMetrics.evToEbitda.value,
    reason: boundary.calculation.blockedMetrics.evToEbitda.reason,
    requiredInputs: boundary.calculation.blockedMetrics.evToEbitda.requiredInputs,
    missingInputs: boundary.calculation.blockedMetrics.evToEbitda.missingInputs,
  },
  {
    key: "dcf",
    label: "DCF",
    status: boundary.calculation.blockedMetrics.dcf.status,
    value: boundary.calculation.blockedMetrics.dcf.value,
    reason: boundary.calculation.blockedMetrics.dcf.reason,
    requiredInputs: boundary.calculation.blockedMetrics.dcf.requiredInputs,
    missingInputs: boundary.calculation.blockedMetrics.dcf.missingInputs,
  },
  {
    key: "fairValueRange",
    label: "intrinsic value band",
    status: boundary.calculation.blockedMetrics.fairValueRange.status,
    value: boundary.calculation.blockedMetrics.fairValueRange.value,
    reason: boundary.calculation.blockedMetrics.fairValueRange.reason,
    requiredInputs: boundary.calculation.blockedMetrics.fairValueRange.requiredInputs,
    missingInputs: boundary.calculation.blockedMetrics.fairValueRange.missingInputs,
  },
];

const inputRows = (boundary: ControlledValuationIntegrationBoundary): InputRow[] =>
  Object.entries(boundary.selectedInputs).map(([key, input]) => ({
    key,
    label: key,
    source: input.source,
    unit: input.unit,
    status: input.normalizationStatus,
    warning: input.warnings.length ? input.warnings.slice(0, 2).map(readableWarning).join(" | ") : "none",
  }));

export function ControlledValuationCalculationPanel({ boundary }: ControlledValuationCalculationPanelProps) {
  const rows = metricRows(boundary);
  const inputs = inputRows(boundary);
  const summary = boundary.calculation.readinessSummary;

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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Ready metrics</p>
            <p className="mt-1 font-semibold text-ink">{summary.readyCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Need input data</p>
            <p className="mt-1 font-semibold text-ink">{summary.insufficientDataCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Not applicable</p>
            <p className="mt-1 font-semibold text-ink">{summary.notApplicableCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Blocked by scope</p>
            <p className="mt-1 font-semibold text-ink">{summary.blockedCount}</p>
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          Valuation cannot claim full DB-backed readiness here: Financials, Market/PVT, units, and source approval
          are checked as separate boundaries. Local/research/sample inputs remain productionApproved:false.
        </div>
        {boundary.sourceBoundary.warnings.length > 0 ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
            Boundary warnings: {boundary.sourceBoundary.warnings.slice(0, 5).map(readableWarning).join(" | ")}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3 font-bold">Input</th>
                <th className="px-3 py-2 font-bold">Source</th>
                <th className="px-3 py-2 font-bold">Unit</th>
                <th className="px-3 py-2 font-bold">Unit status</th>
                <th className="py-2 pl-3 font-bold">Boundary note</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((row) => (
                <tr className="border-b border-border-soft last:border-0" key={row.key}>
                  <td className="py-3 pr-3 font-bold text-ink">{row.label}</td>
                  <td className="px-3 py-3 text-xs text-muted">{readableWarning(row.source)}</td>
                  <td className="px-3 py-3 text-xs text-muted">{readableWarning(row.unit)}</td>
                  <td className="px-3 py-3">
                    <Chip size="sm" variant={row.status === "ready" ? "success" : "warning"}>
                      {readableWarning(row.status)}
                    </Chip>
                  </td>
                  <td className="py-3 pl-3 text-xs leading-5 text-muted">{row.warning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  <td className="py-3 pl-3 text-xs leading-5 text-muted">
                    <span className="font-semibold text-ink">{statusExplanation[row.status]}</span>{" "}
                    {readableReason(row.reason)}
                    {row.missingInputs.length > 0 ? ` Missing: ${row.missingInputs.join(", ")}.` : ""}
                    {row.requiredInputs.length > 0 ? ` Required: ${row.requiredInputs.join(", ")}.` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
