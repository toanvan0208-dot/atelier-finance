import { Chip } from "@/components/ui";
import { buildFinancialsDataSourceTransparency } from "../lib/financials-data-source-transparency";
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";

type FinancialsSourceTransparencyProps = {
  runtimeData: FinancialsRuntimeData;
};

const labelValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "unavailable";
  return String(value);
};

const sourceNote = (runtimeData: FinancialsRuntimeData): string => {
  if (runtimeData.source.readPath === "local_db") {
    return "Du lieu local DB phuc vu nghien cuu va kiem tra source evidence. Chua duoc duyet lam nguon san xuat.";
  }

  if (runtimeData.runtimeStatus === "sample_fallback") {
    return "Du lieu mau tinh (static sample). Fallback dang bat; DB-backed financials chi bat khi ATELIER_FINANCIALS_DB_SOURCE=enabled.";
  }

  return "Nguon du lieu chua co trang thai duyet cho san xuat; can doc kem pham vi va thoi diem cap nhat.";
};

const readPathLabel = (runtimeData: FinancialsRuntimeData): string => {
  if (runtimeData.source.readPath === "local_db") return "local DB research-only";
  if (runtimeData.source.readPath === "sample_static") return "static sample fallback";
  return runtimeData.source.readPath;
};

const fallbackLabel = (runtimeData: FinancialsRuntimeData): string =>
  runtimeData.source.fallbackUsed ? "Fallback dang bat" : "Fallback khong dung";

export function FinancialsSourceTransparency({ runtimeData }: FinancialsSourceTransparencyProps) {
  const transparency = buildFinancialsDataSourceTransparency(runtimeData);
  const hasMissingFields = runtimeData.dataQuality.missingFields.length > 0;
  const hasWarnings = runtimeData.dataQuality.warnings.length > 0;
  const hasErrors = runtimeData.dataQuality.errors.length > 0;

  const fields = [
    ["Nguon du lieu", runtimeData.source.sourceLabel],
    ["Che do du lieu", runtimeData.source.dataMode],
    ["Duong doc du lieu", runtimeData.source.readPath],
    ["Trang thai runtime", runtimeData.runtimeStatus],
    ["Trang thai du lieu", runtimeData.dataQuality.status],
    ["fallbackUsed", runtimeData.source.fallbackUsed],
    ["productionApproved", runtimeData.source.productionApproved],
    ["Ticker", runtimeData.source.ticker],
    ["Nam tai chinh", runtimeData.source.fiscalYear],
    ["Ky bao cao", runtimeData.source.periodType],
    ["Moc du lieu", runtimeData.source.asOf],
    ["Transparency dataMode", transparency.dataMode],
    ["Source evidence", transparency.sourceEvidenceStatus],
    ["Unit metadata", transparency.unitMetadataStatus],
    ["Valuation handoff", transparency.valuationHandoffStatus],
    ["canClaimFinancialsDbBacked", transparency.canClaimFinancialsDbBacked],
    ["canClaimValuationDbBacked", transparency.canClaimValuationDbBacked],
  ] as const;
  const visibleMissingFields = transparency.missingFields;
  const visibleBlockedReasons = transparency.blockedReasons;

  return (
    <section
      aria-label="Financials source transparency"
      className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">source transparency</Chip>
            <Chip variant="neutral">{runtimeData.runtimeStatus}</Chip>
            <Chip variant="neutral">{transparency.dataMode}</Chip>
            <Chip variant="neutral">{readPathLabel(runtimeData)}</Chip>
            <Chip variant="neutral">{fallbackLabel(runtimeData)}</Chip>
            <Chip variant="neutral">productionApproved:false</Chip>
            <Chip variant="neutral">units:{transparency.unitMetadataStatus}</Chip>
            <Chip variant="neutral">valuation:{transparency.valuationHandoffStatus}</Chip>
            {hasMissingFields ? <Chip variant="neutral">partial/missing</Chip> : null}
          </div>
          <p className="mt-3 font-semibold">{sourceNote(runtimeData)}</p>
          <p className="mt-1">
            Chua duoc phe duyet production. Du lieu thieu duoc giu la null/unavailable, khong thay bang 0.
          </p>
          <p className="mt-1">
            Boundary nay chi ap dung cho module Financials; Overview, Valuation va Risk co metadata rieng va khong tu
            dong tro thanh DB-backed theo Financials.
          </p>
          {visibleMissingFields.length > 0 ? (
            <p className="mt-2">
              Truong du lieu con thieu: {visibleMissingFields.join(", ")}.
            </p>
          ) : null}
          {visibleBlockedReasons.length > 0 ? (
            <p className="mt-2">Ly do dang chan: {visibleBlockedReasons.slice(0, 6).join(" | ")}.</p>
          ) : null}
          {transparency.uiWarnings.length > 0 ? (
            <p className="mt-2">Ghi chu UI: {transparency.uiWarnings.join(" | ")}</p>
          ) : null}
          {hasWarnings ? <p className="mt-2">Canh bao: {runtimeData.dataQuality.warnings.join(" | ")}</p> : null}
          {hasErrors ? <p className="mt-2">Loi doc du lieu: {runtimeData.dataQuality.errors.join(" | ")}</p> : null}
        </div>
        <dl className="grid min-w-0 gap-2 text-xs lg:min-w-[320px]">
          {fields.map(([label, value]) => (
            <div className="grid grid-cols-[120px_1fr] gap-3" key={label}>
              <dt className="font-bold">{label}</dt>
              <dd className="min-w-0 break-words text-right">{labelValue(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
