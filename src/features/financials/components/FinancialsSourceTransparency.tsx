import { Chip } from "@/components/ui";
import { auditFinancialsStatementSnapshot } from "../lib/financials-data-audit";
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";

type FinancialsSourceTransparencyProps = {
  runtimeData: FinancialsRuntimeData;
  supplementalAvailableFields?: string[];
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

const auditStatusLabel = {
  available: "Đã có dữ liệu",
  insufficient: "Chưa đủ để diễn giải",
  missing: "Chưa đủ dữ liệu",
} as const;

const missingFieldLabel = (field: string): string => fieldLabel[field] ?? field;

export function FinancialsSourceTransparency({
  runtimeData,
  supplementalAvailableFields = [],
}: FinancialsSourceTransparencyProps) {
  const fieldAudit = auditFinancialsStatementSnapshot(runtimeData.statementSnapshot);
  const visibleMissingFields = runtimeData.dataQuality.missingFields.filter(
    (field) => !supplementalAvailableFields.includes(field),
  );
  const shownMissingFields = visibleMissingFields.slice(0, 4).map(missingFieldLabel);

  return (
    <section
      aria-label="Financials data note"
      className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]"
    >
      <div className="flex flex-wrap gap-2">
        <Chip variant="neutral">Dữ liệu đang rà soát</Chip>
        <Chip variant="neutral">Không thay dữ liệu thiếu bằng 0</Chip>
        {visibleMissingFields.length > 0 ? <Chip variant="neutral">Còn dữ liệu cần kiểm tra</Chip> : null}
      </div>

      <p className="mt-3 font-semibold">
        Phần BCTC chỉ hiển thị những dữ liệu đang có. Nếu thiếu đầu vào, hệ thống sẽ để Chưa đủ dữ liệu hoặc N/A thay vì tự suy đoán.
      </p>

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

      {shownMissingFields.length > 0 ? (
        <p className="mt-2">
          Cần kiểm tra thêm: {shownMissingFields.join(", ")}
          {visibleMissingFields.length > shownMissingFields.length ? ", ..." : ""}.
        </p>
      ) : null}
    </section>
  );
}
