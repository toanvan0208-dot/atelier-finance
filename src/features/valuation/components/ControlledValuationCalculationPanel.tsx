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

const inputLabel: Record<string, string> = {
  equity: "Vốn chủ sở hữu",
  eps: "EPS",
  marketCap: "Vốn hóa",
  marketPrice: "Giá thị trường",
  netIncome: "Lợi nhuận sau thuế",
  revenue: "Doanh thu",
  sharesOutstanding: "Số cổ phiếu",
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return "Chưa đủ dữ liệu";

  const maximumFractionDigits = Math.abs(value) > 0 && Math.abs(value) < 1 ? 6 : 2;
  const formatted = value.toLocaleString("vi-VN", { maximumFractionDigits });

  return formatted === "0" && value !== 0 ? value.toPrecision(4) : formatted;
};

const readableReasonMap: Record<string, string> = {
  blocked_no_dcf_wacc_in_phase_59: "Đang chặn: dữ liệu dòng tiền và WACC chưa đủ trong phạm vi hiện tại.",
  blocked_no_intrinsic_value_band_in_phase_59: "Đang chặn: mô hình nâng cao không nằm trong phạm vi MVP.",
  blocked_until_ebitda_source_is_explicit: "Đang chặn: EBITDA chưa có nguồn rõ.",
  blocked_until_explicit_ev_inputs: "Đang chặn: dữ liệu EV chưa đủ nguồn rõ.",
  bvps_not_ready: "Chưa đủ dữ liệu: BVPS chưa thể tính.",
  eps_non_positive: "N/A: EPS không dương.",
  equity_non_positive: "N/A: vốn chủ sở hữu không dương.",
  market_cap_not_ready: "Chưa đủ dữ liệu: vốn hóa chưa thể tính.",
  missing_eps: "Chưa đủ dữ liệu: thiếu EPS.",
  missing_equity: "Chưa đủ dữ liệu: thiếu vốn chủ sở hữu.",
  missing_revenue: "Chưa đủ dữ liệu: thiếu doanh thu.",
  missing_valid_market_price: "Chưa đủ dữ liệu: thiếu giá thị trường hợp lệ.",
  missing_valid_market_price_or_shares: "Chưa đủ dữ liệu: thiếu giá thị trường hoặc số cổ phiếu hợp lệ.",
  missing_valid_shares: "Chưa đủ dữ liệu: thiếu số cổ phiếu hợp lệ.",
  ready: "Có thể tính: các đầu vào bắt buộc hợp lệ.",
  ready_from_direct_market_cap: "Có thể tính: vốn hóa có đầu vào trực tiếp.",
  ready_from_market_price_and_shares: "Có thể tính: giá thị trường và số cổ phiếu hợp lệ.",
};

const statusExplanation: Record<ControlledValuationMetricStatus, string> = {
  blocked: "Đang chặn theo phạm vi an toàn.",
  insufficient_data: "Chưa đủ dữ liệu để tính.",
  not_applicable: "N/A với dữ liệu hiện tại.",
  ready: "Có thể tính với đầu vào hiện tại.",
};

const readableReason = (reason: string): string => readableReasonMap[reason] ?? reason.replace(/_/g, " ");

const readableWarning = (warning: string): string => warning.replace(/_/g, " ");

const statusLabel: Record<ControlledValuationMetricStatus, string> = {
  blocked: "Đang chặn",
  insufficient_data: "Chưa đủ dữ liệu",
  not_applicable: "N/A",
  ready: "Có thể tính",
};

const sourceLabel = (source: string): string => {
  if (source === "financials_runtime" || source.includes("financials")) return "Báo cáo tài chính đã rà soát";
  if (source === "market_pvt" || source.includes("market")) return "Giá/khối lượng đã có trong hệ thống";
  if (source === "persisted_bridge") return "Bản ghi đã lưu trong hệ thống";
  if (source === "unavailable") return "Chưa đủ dữ liệu";
  return "Nguồn có metadata";
};

const boundaryWarningLabel = (warning: string): string => {
  const normalized = readableWarning(warning);
  if (normalized.includes("mixed source")) return "Nguồn dữ liệu được kiểm tra theo nhiều lớp.";
  if (normalized.includes("not production approved") || normalized.includes("production approved false")) {
    return "Nguồn hiện dùng cho nghiên cứu và chưa phê duyệt sản xuất.";
  }
  if (normalized.includes("fallback")) return "Dữ liệu thay thế/minh họa không được dùng như dữ liệu thật.";
  if (normalized.includes("db backed")) return "Có dữ liệu trong hệ thống, nhưng vẫn giữ ranh giới định giá.";
  if (normalized.includes("claim")) return "Chưa đủ điều kiện để coi định giá là dữ liệu DB đầy đủ.";
  return readableWarning(warning);
};

const metricRows = (boundary: ControlledValuationIntegrationBoundary): MetricRow[] => [
  {
    key: "marketCap",
    label: "Vốn hóa",
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
];

const inputRows = (boundary: ControlledValuationIntegrationBoundary): InputRow[] =>
  Object.entries(boundary.selectedInputs).map(([key, input]) => ({
    key,
    label: inputLabel[key] ?? key,
    source: input.source,
    unit: input.unit,
    status: input.normalizationStatus,
    warning: input.warnings.length ? input.warnings.slice(0, 2).map(readableWarning).join(" | ") : "Không có cảnh báo thêm",
  }));

export function ControlledValuationCalculationPanel({ boundary }: ControlledValuationCalculationPanelProps) {
  const rows = metricRows(boundary);
  const inputs = inputRows(boundary);
  const summary = boundary.calculation.readinessSummary;

  return (
    <Card data-testid="controlled-valuation-calculation-panel">
      <CardHeader
        chip={<Chip variant="neutral">Chỉ đọc</Chip>}
        description="Phần này chỉ hiển thị các chỉ số định giá có thể tính được từ dữ liệu hiện có. Đây không phải khuyến nghị đầu tư."
        title="Trạng thái chỉ số định giá"
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip variant="neutral">Bản ghi đã rà soát</Chip>
          <Chip variant="neutral">Dùng cho nghiên cứu</Chip>
          <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
          <Chip variant="neutral">Có guardrail</Chip>
        </div>
        <p className="text-xs leading-5 text-muted">
          Bảng này chỉ cho biết chỉ số nào có thể tính, chỉ số nào còn thiếu dữ liệu hoặc bị chặn theo phạm vi an toàn.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Có thể tính</p>
            <p className="mt-1 font-semibold text-ink">{summary.readyCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Cần dữ liệu</p>
            <p className="mt-1 font-semibold text-ink">{summary.insufficientDataCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">N/A</p>
            <p className="mt-1 font-semibold text-ink">{summary.notApplicableCount}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5">
            <p className="font-bold uppercase text-muted">Bị chặn</p>
            <p className="mt-1 font-semibold text-ink">{summary.blockedCount}</p>
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          Định giá vẫn giữ ranh giới riêng: Financials, Market/PVT, đơn vị và trạng thái nguồn được kiểm tra riêng.
          Dữ liệu hiện tại dùng cho nghiên cứu và chưa phê duyệt sản xuất.
        </div>
        {boundary.sourceBoundary.warnings.length > 0 ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
            Ghi chú: {boundary.sourceBoundary.warnings.slice(0, 5).map(boundaryWarningLabel).join(" | ")}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3 font-bold">Đầu vào</th>
                <th className="px-3 py-2 font-bold">Nguồn</th>
                <th className="px-3 py-2 font-bold">Đơn vị</th>
                <th className="px-3 py-2 font-bold">Trạng thái</th>
                <th className="py-2 pl-3 font-bold">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((row) => (
                <tr className="border-b border-border-soft last:border-0" key={row.key}>
                  <td className="py-3 pr-3 font-bold text-ink">{row.label}</td>
                  <td className="px-3 py-3 text-xs text-muted">{sourceLabel(row.source)}</td>
                  <td className="px-3 py-3 text-xs text-muted">{readableWarning(row.unit)}</td>
                  <td className="px-3 py-3">
                    <Chip size="sm" variant={row.status === "ready" ? "success" : "warning"}>
                      {row.status === "ready" ? "Sẵn sàng" : readableWarning(row.status)}
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
                <th className="py-2 pr-3 font-bold">Chỉ số</th>
                <th className="px-3 py-2 font-bold">Trạng thái</th>
                <th className="px-3 py-2 text-right font-bold">Giá trị</th>
                <th className="py-2 pl-3 font-bold">Giải thích</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-border-soft last:border-0" key={row.key}>
                  <td className="py-3 pr-3 font-bold text-ink">{row.label}</td>
                  <td className="px-3 py-3">
                    <Chip size="sm" variant={statusVariant[row.status]}>
                      {statusLabel[row.status]}
                    </Chip>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {row.status === "ready" ? formatMetricValue(row.value) : "Chưa đủ dữ liệu"}
                  </td>
                  <td className="py-3 pl-3 text-xs leading-5 text-muted">
                    <span className="font-semibold text-ink">{statusExplanation[row.status]}</span>{" "}
                    {readableReason(row.reason)}
                    {row.missingInputs.length > 0 ? ` Thiếu: ${row.missingInputs.join(", ")}.` : ""}
                    {row.requiredInputs.length > 0 ? ` Cần: ${row.requiredInputs.join(", ")}.` : ""}
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
