import { Chip } from "@/components/ui";
import { auditFinancialsStatementSnapshot } from "../lib/financials-data-audit";
import { buildFinancialsDataSourceTransparency } from "../lib/financials-data-source-transparency";
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";

type FinancialsSourceTransparencyProps = {
  runtimeData: FinancialsRuntimeData;
  supplementalAvailableFields?: string[];
};

const sourceNote = (runtimeData: FinancialsRuntimeData): string => {
  if (runtimeData.source.readPath === "local_db") {
    return "Đã có dữ liệu tài chính trong hệ thống cho mục đích nghiên cứu. Dữ liệu này chưa phê duyệt sản xuất.";
  }

  if (runtimeData.runtimeStatus === "sample_fallback") {
    return "Đang dùng dữ liệu minh họa vì chưa có báo cáo tài chính local/imported đủ dùng.";
  }

  return "Nguồn dữ liệu cần đọc kèm phạm vi, mốc thời gian và trạng thái rà soát.";
};

const readableStatus = (value: string): string => value.replace(/_/g, " ");

const dataModeExplanation: Record<string, string> = {
  db_backed: "Đã có dữ liệu trong hệ thống, phạm vi nghiên cứu",
  local_research: "Dữ liệu local phục vụ nghiên cứu",
  manual: "Dữ liệu nhập tay, cần rà soát",
  research_only: "Dữ liệu nghiên cứu, cần rà soát",
  sample: "Dữ liệu minh họa",
  unknown: "Chưa rõ chế độ dữ liệu",
};

const sourceEvidenceExplanation: Record<string, string> = {
  available:
    "Có metadata nguồn; vẫn cần giữ trạng thái chưa phê duyệt sản xuất",
  missing: "Thiếu metadata nguồn",
  not_approved: "Có metadata nguồn, nhưng chưa phê duyệt sản xuất",
  partial: "Một phần metadata nguồn đã có; cần rà soát thêm",
};

const unitMetadataExplanation: Record<string, string> = {
  explicit: "Các trường hiện có đã có đơn vị rõ",
  invalid: "Đơn vị không hợp lệ nên chỉ số nhạy đơn vị bị chặn",
  partial: "Một số trường đã có đơn vị rõ; một số trường vẫn cần bổ sung",
  unknown: "Các trường hiện có chưa có đơn vị rõ",
};

const valuationHandoffExplanation: Record<string, string> = {
  blocked: "Chưa đủ trường hoặc đơn vị để chuyển sang định giá",
  not_applicable: "Chưa có snapshot báo cáo tài chính",
  partial: "Chuyển một phần; định giá vẫn có ranh giới riêng",
  ready_with_explicit_units:
    "Trường tài chính có đơn vị rõ; định giá vẫn kiểm tra riêng",
};

const fieldLabel: Record<string, string> = {
  eps: "EPS",
  equity: "Vốn chủ sở hữu",
  netIncome: "Lợi nhuận sau thuế",
  operatingCashFlow: "Dòng tiền hoạt động",
  revenue: "Doanh thu",
  sharesOutstanding: "Số cổ phiếu",
  totalAssets: "Tổng tài sản",
  totalDebt: "Nợ vay",
};

const missingFieldLabel = (field: string): string => fieldLabel[field] ?? readableStatus(field);

const blockedReasonLabel = (reason: string): string => {
  if (reason.includes("unit_invalid")) return "Đơn vị dữ liệu không hợp lệ";
  if (reason.includes("unit_unknown") || reason.includes("explicit_unit_required")) {
    return "Chưa có đơn vị dữ liệu rõ ràng";
  }
  if (reason.includes("missing")) return "Thiếu trường dữ liệu cần thiết";
  if (reason.includes("snapshot_unavailable")) return "Chưa có snapshot báo cáo tài chính";
  return "Dữ liệu chưa đủ điều kiện để chuyển tiếp";
};

const runtimeWarningLabel = (warning: string): string => {
  const normalized = warning.toLowerCase();
  if (normalized.includes("ticker mismatch")) {
    return "Dữ liệu khác ticker đã bị chặn.";
  }
  if (normalized.includes("sample") || normalized.includes("no usable")) {
    return "Chưa có dữ liệu local đủ dùng; không hiển thị số liệu minh họa như dữ liệu thật.";
  }
  if (normalized.includes("missing") || normalized.includes("partial")) {
    return "Một số trường dữ liệu còn thiếu và được giữ ở trạng thái Chưa đủ dữ liệu.";
  }
  return "Dữ liệu tài chính đang được rà soát.";
};

const auditStatusLabel = {
  available: "Đã có dữ liệu",
  insufficient: "Chưa đủ điều kiện diễn giải",
  missing: "Chưa đủ dữ liệu",
} as const;

const userWarningLabel = (warning: string): string => {
  if (warning.includes("productionApproved:false"))
    return "Nguồn hiện dùng cho nghiên cứu và chưa phê duyệt sản xuất.";
  if (warning.includes("canClaimValuationDbBacked:false"))
    return "Định giá vẫn kiểm tra ranh giới riêng trước khi dùng.";
  if (warning.includes("local DB boundary"))
    return "Financials đang đọc dữ liệu đã có trong hệ thống.";
  if (warning.includes("Du lieu thieu"))
    return "Dữ liệu thiếu được giữ nguyên, không thay bằng 0.";
  return warning;
};

export function FinancialsSourceTransparency({
  runtimeData,
  supplementalAvailableFields = [],
}: FinancialsSourceTransparencyProps) {
  const transparency = buildFinancialsDataSourceTransparency(runtimeData);
  const fieldAudit = auditFinancialsStatementSnapshot(runtimeData.statementSnapshot);
  const hasMissingFields = runtimeData.dataQuality.missingFields.length > 0;
  const hasWarnings = runtimeData.dataQuality.warnings.length > 0;
  const hasErrors = runtimeData.dataQuality.errors.length > 0;
  const summaryRows = [
    [
      "Phân loại dữ liệu",
      dataModeExplanation[transparency.dataMode] ??
        readableStatus(transparency.dataMode),
    ],
    [
      "Nguồn/evidence",
      sourceEvidenceExplanation[transparency.sourceEvidenceStatus] ??
        readableStatus(transparency.sourceEvidenceStatus),
    ],
    [
      "Đơn vị dữ liệu",
      unitMetadataExplanation[transparency.unitMetadataStatus] ??
        readableStatus(transparency.unitMetadataStatus),
    ],
    [
      "Chuyển sang định giá",
      valuationHandoffExplanation[transparency.valuationHandoffStatus] ??
        readableStatus(transparency.valuationHandoffStatus),
    ],
  ] as const;
  const visibleMissingFields = transparency.missingFields.filter(
    (field) => !supplementalAvailableFields.includes(field),
  );
  const visibleBlockedReasons = transparency.blockedReasons.filter(
    (reason) =>
      !supplementalAvailableFields.some((field) => reason.includes(field)),
  );
  const visibleBlockedLabels = Array.from(
    new Set(visibleBlockedReasons.map(blockedReasonLabel)),
  );

  return (
    <section
      aria-label="Financials source transparency"
      className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">Nguồn dữ liệu</Chip>
            <Chip variant="neutral">
              {runtimeData.source.readPath === "local_db"
                ? "Đã có trong hệ thống"
                : "Minh họa/đang chờ dữ liệu"}
            </Chip>
            <Chip variant="neutral">Dùng cho nghiên cứu</Chip>
            <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
            <Chip variant="neutral">
              Đơn vị:{" "}
              {unitMetadataExplanation[transparency.unitMetadataStatus] ??
                readableStatus(transparency.unitMetadataStatus)}
            </Chip>
            {hasMissingFields ? (
              <Chip variant="neutral">Còn thiếu trường</Chip>
            ) : null}
          </div>
          <p className="mt-3 font-semibold">{sourceNote(runtimeData)}</p>
          <p className="mt-1">
            Dữ liệu thiếu được giữ là null/unavailable, không thay bằng 0.
          </p>
          <p className="mt-1">
            Financials cung cấp đầu vào cho các module khác, nhưng mỗi module
            vẫn tự kiểm tra nguồn và điều kiện dùng.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {summaryRows.map(([label, value]) => (
              <div
                className="rounded-[4px] border border-[#E8CC82] bg-white/55 px-3 py-2"
                key={label}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.02em]">
                  {label}
                </p>
                <p className="mt-1 leading-5">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["EPS", fieldAudit.eps],
              ["Số cổ phiếu", fieldAudit.sharesOutstanding],
              ["Vốn chủ sở hữu", fieldAudit.equity],
              ["Nợ vay", fieldAudit.totalDebt],
            ].map(([label, status]) => (
              <div
                className="rounded-[4px] border border-[#E8CC82] bg-white/55 px-3 py-2"
                key={label}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.02em]">{label}</p>
                <p className="mt-1 leading-5">
                  {auditStatusLabel[status as keyof typeof auditStatusLabel]}
                </p>
              </div>
            ))}
          </div>
          {visibleMissingFields.length > 0 ? (
            <p className="mt-2">
              Trường dữ liệu còn thiếu: {visibleMissingFields.map(missingFieldLabel).join(", ")}.
            </p>
          ) : null}
          {visibleBlockedLabels.length > 0 ? (
            <p className="mt-2">
              Lý do đang chặn:{" "}
              {visibleBlockedLabels.slice(0, 4).join(" | ")}.
            </p>
          ) : null}
          {transparency.uiWarnings.length > 0 ? (
            <p className="mt-2">
              Ghi chú:{" "}
              {transparency.uiWarnings.map(userWarningLabel).join(" | ")}
            </p>
          ) : null}
          {hasWarnings ? (
            <p className="mt-2">
              Cảnh báo: {Array.from(new Set(runtimeData.dataQuality.warnings.map(runtimeWarningLabel))).join(" | ")}
            </p>
          ) : null}
          {hasErrors ? (
            <p className="mt-2">
              Chưa thể đọc đầy đủ dữ liệu từ nguồn hiện tại. Không dùng dữ liệu thay thế của ticker khác.
            </p>
          ) : null}
        </div>
        <dl className="grid min-w-0 gap-2 text-xs lg:min-w-[320px]">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-bold">Ticker</dt>
            <dd className="min-w-0 break-words text-right">
              {runtimeData.source.ticker}
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-bold">Năm/kỳ</dt>
            <dd className="min-w-0 break-words text-right">
              {runtimeData.source.fiscalYear ?? "chưa rõ"} ·{" "}
              {runtimeData.source.periodType ?? "chưa rõ"}
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-bold">Mốc dữ liệu</dt>
            <dd className="min-w-0 break-words text-right">
              {runtimeData.source.asOf ?? "chưa rõ"}
            </dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-bold">Trạng thái</dt>
            <dd className="min-w-0 break-words text-right">
              dữ liệu nghiên cứu, chưa phê duyệt sản xuất
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
