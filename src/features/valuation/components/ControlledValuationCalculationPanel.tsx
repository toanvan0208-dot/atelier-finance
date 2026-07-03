import { Card, CardBody, Chip } from "@/components/ui";
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
  missingInputs: string[];
  helper: string;
};

const statusVariant: Record<ControlledValuationMetricStatus, "success" | "warning" | "danger" | "neutral"> = {
  blocked: "neutral",
  insufficient_data: "warning",
  not_applicable: "neutral",
  ready: "success",
};

const statusLabel: Record<ControlledValuationMetricStatus, string> = {
  blocked: "Chưa mở",
  insufficient_data: "Chưa đủ dữ liệu",
  not_applicable: "N/A",
  ready: "Có thể tính",
};

const readableReasonMap: Record<string, string> = {
  blocked_no_dcf_wacc_in_phase_59: "Cần chuỗi dòng tiền, chi phí vốn và tăng trưởng dài hạn rõ hơn.",
  blocked_no_intrinsic_value_band_in_phase_59: "Chưa mở phần mô hình nâng cao khi dữ liệu nền chưa đủ.",
  blocked_until_ebitda_source_is_explicit: "Cần nguồn EBITDA rõ trước khi đọc EV/EBITDA.",
  blocked_until_explicit_ev_inputs: "Cần vốn hóa, nợ và tiền mặt rõ trước khi đọc EV.",
  bvps_not_ready: "BVPS chưa sẵn sàng nên P/B chưa thể đọc chắc.",
  eps_non_positive: "EPS không dương nên P/E không phù hợp để diễn giải.",
  equity_non_positive: "Vốn chủ sở hữu không dương nên P/B không phù hợp để diễn giải.",
  market_cap_not_ready: "Vốn hóa chưa thể tính từ dữ liệu hiện có.",
  missing_eps: "Thiếu EPS.",
  missing_equity: "Thiếu vốn chủ sở hữu.",
  missing_revenue: "Thiếu doanh thu.",
  missing_valid_market_price: "Thiếu giá thị trường hợp lệ.",
  missing_valid_market_price_or_shares: "Thiếu giá thị trường hoặc số cổ phiếu hợp lệ.",
  missing_valid_shares: "Thiếu số cổ phiếu hợp lệ.",
  ready: "Các đầu vào bắt buộc đã hợp lệ.",
  ready_from_direct_market_cap: "Vốn hóa có sẵn trong dữ liệu.",
  ready_from_market_price_and_shares: "Có giá thị trường và số cổ phiếu hợp lệ.",
};

const inputLabel: Record<string, string> = {
  bvps: "BVPS",
  equity: "vốn chủ sở hữu",
  eps: "EPS",
  marketCap: "vốn hóa",
  marketPrice: "giá thị trường",
  revenue: "doanh thu",
  sharesOutstanding: "số cổ phiếu",
};

const formatMetricValue = (value: number | null): string => {
  if (value === null) return "Chưa đủ dữ liệu";

  const maximumFractionDigits = Math.abs(value) > 0 && Math.abs(value) < 1 ? 6 : 2;
  const formatted = value.toLocaleString("vi-VN", { maximumFractionDigits });

  return formatted === "0" && value !== 0 ? value.toPrecision(4) : formatted;
};

const readableReason = (reason: string): string => readableReasonMap[reason] ?? reason.replace(/_/g, " ");

const missingInputText = (row: MetricRow): string => {
  if (row.missingInputs.length === 0) return "Không có trường bắt buộc đang thiếu.";
  return `Còn thiếu: ${row.missingInputs.map((input) => inputLabel[input] ?? input).join(", ")}.`;
};

const metricRows = (boundary: ControlledValuationIntegrationBoundary): MetricRow[] => [
  {
    key: "marketCap",
    label: "Vốn hóa",
    status: boundary.calculation.metrics.marketCap.status,
    value: boundary.calculation.metrics.marketCap.value,
    reason: boundary.calculation.metrics.marketCap.reason,
    missingInputs: boundary.calculation.metrics.marketCap.missingInputs,
    helper: "Quy mô thị trường đang trả cho toàn bộ doanh nghiệp.",
  },
  {
    key: "pe",
    label: "P/E",
    status: boundary.calculation.metrics.pe.status,
    value: boundary.calculation.metrics.pe.value,
    reason: boundary.calculation.metrics.pe.reason,
    missingInputs: boundary.calculation.metrics.pe.missingInputs,
    helper: "Giá đang bằng bao nhiêu lần lợi nhuận trên mỗi cổ phiếu.",
  },
  {
    key: "bvps",
    label: "BVPS",
    status: boundary.calculation.metrics.bvps.status,
    value: boundary.calculation.metrics.bvps.value,
    reason: boundary.calculation.metrics.bvps.reason,
    missingInputs: boundary.calculation.metrics.bvps.missingInputs,
    helper: "Giá trị sổ sách trên mỗi cổ phiếu, đọc cùng P/B.",
  },
  {
    key: "pb",
    label: "P/B",
    status: boundary.calculation.metrics.pb.status,
    value: boundary.calculation.metrics.pb.value,
    reason: boundary.calculation.metrics.pb.reason,
    missingInputs: boundary.calculation.metrics.pb.missingInputs,
    helper: "Giá đang bằng bao nhiêu lần giá trị sổ sách.",
  },
  {
    key: "ps",
    label: "P/S",
    status: boundary.calculation.metrics.ps.status,
    value: boundary.calculation.metrics.ps.value,
    reason: boundary.calculation.metrics.ps.reason,
    missingInputs: boundary.calculation.metrics.ps.missingInputs,
    helper: "Giá trị thị trường so với doanh thu, chỉ là góc nhìn phụ.",
  },
];

const lockedRows = (boundary: ControlledValuationIntegrationBoundary): MetricRow[] => [
  {
    key: "ev",
    label: "EV",
    status: boundary.calculation.blockedMetrics.ev.status,
    value: null,
    reason: boundary.calculation.blockedMetrics.ev.reason,
    missingInputs: boundary.calculation.blockedMetrics.ev.missingInputs,
    helper: "Không hiển thị khi thiếu nợ và tiền mặt rõ nguồn.",
  },
  {
    key: "evToEbitda",
    label: "EV/EBITDA",
    status: boundary.calculation.blockedMetrics.evToEbitda.status,
    value: null,
    reason: boundary.calculation.blockedMetrics.evToEbitda.reason,
    missingInputs: boundary.calculation.blockedMetrics.evToEbitda.missingInputs,
    helper: "Chỉ nên đọc khi EBITDA có nguồn rõ.",
  },
  {
    key: "dcf",
    label: "DCF",
    status: boundary.calculation.blockedMetrics.dcf.status,
    value: null,
    reason: boundary.calculation.blockedMetrics.dcf.reason,
    missingInputs: boundary.calculation.blockedMetrics.dcf.missingInputs,
    helper: "Mô hình dòng tiền cần giả định sâu hơn.",
  },
];

export function ControlledValuationCalculationPanel({ boundary }: ControlledValuationCalculationPanelProps) {
  const rows = metricRows(boundary);
  const advancedRows = lockedRows(boundary);
  const summary = boundary.calculation.readinessSummary;

  return (
    <section className="space-y-4" data-testid="controlled-valuation-calculation-panel">
      <div className="space-y-1">
        <h2 className="text-xl font-bold leading-7 text-ink">Các tỷ số nào đang đọc được?</h2>
        <p className="max-w-[74ch] text-sm leading-6 text-muted">
          Mỗi thẻ chỉ hiện kết quả khi đầu vào đủ điều kiện. Nếu thiếu dữ liệu, hệ thống giữ nguyên trạng thái chưa đủ dữ liệu hoặc N/A.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => (
          <Card key={row.key} className="border-border-soft">
            <CardBody className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-ink">{row.label}</h3>
                <Chip size="sm" variant={statusVariant[row.status]}>
                  {statusLabel[row.status]}
                </Chip>
              </div>
              <p className="text-2xl font-extrabold leading-none text-ink">
                {row.status === "ready" ? formatMetricValue(row.value) : row.status === "not_applicable" ? "N/A" : "Chưa sẵn sàng"}
              </p>
              <p className="text-sm leading-6 text-muted">{row.helper}</p>
              <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                {row.status === "ready" ? readableReason(row.reason) : `${readableReason(row.reason)} ${missingInputText(row)}`}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold leading-7 text-ink">Điều kiện để tin các tỷ số này</h2>
              <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
                Đây là lớp kiểm tra dữ liệu, không phải lời khuyên đầu tư. Số thiếu không được thay bằng 0.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <p className="font-bold text-ink">{summary.readyCount}</p>
                <p className="mt-1 text-muted">có thể tính</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <p className="font-bold text-ink">{summary.insufficientDataCount + summary.notApplicableCount}</p>
                <p className="mt-1 text-muted">cần xem lại</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <p className="font-bold text-ink">{summary.blockedCount}</p>
                <p className="mt-1 text-muted">chưa mở</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {advancedRows.map((row) => (
              <section key={row.key} className="rounded-[4px] border border-[#D9C99B] bg-[#F8F1DC] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{row.label}</h3>
                  <Chip size="sm" variant="neutral">
                    Chưa mở
                  </Chip>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{row.helper}</p>
                <p className="mt-2 text-xs leading-5 text-subtle">{readableReason(row.reason)}</p>
              </section>
            ))}
          </div>

          <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
            Tỷ số chỉ là điểm bắt đầu để đặt câu hỏi. Cần đọc cùng chất lượng lợi nhuận, dòng tiền, nợ vay và bối cảnh ngành trước khi kết luận.
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
