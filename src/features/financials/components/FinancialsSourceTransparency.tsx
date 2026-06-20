import { Chip } from "@/components/ui";
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";

type FinancialsSourceTransparencyProps = {
  runtimeData: FinancialsRuntimeData;
};

const labelValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "unavailable";
  return String(value);
};

const sourceNote = (runtimeData: FinancialsRuntimeData): string => {
  if (runtimeData.source.sourceLabel === "phase45_synthetic_financial_statement_local_write") {
    return "Du lieu local research / synthetic, chi dung cho kiem thu do an. Chua phai BCTC chinh thuc.";
  }

  if (runtimeData.runtimeStatus === "sample_fallback") {
    return "Dang dung sample fallback. DB-backed financials chi bat khi ATELIER_FINANCIALS_DB_SOURCE=enabled.";
  }

  return "Nguon du lieu chua duoc phe duyet production; can doc kem pham vi va thoi diem cap nhat.";
};

export function FinancialsSourceTransparency({ runtimeData }: FinancialsSourceTransparencyProps) {
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
  ] as const;

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
            <Chip variant="neutral">productionApproved:false</Chip>
            {hasMissingFields ? <Chip variant="neutral">partial/missing</Chip> : null}
          </div>
          <p className="mt-3 font-semibold">{sourceNote(runtimeData)}</p>
          <p className="mt-1">
            Chua duoc phe duyet production. Du lieu thieu duoc giu la null/unavailable, khong thay bang 0.
          </p>
          {hasMissingFields ? (
            <p className="mt-2">
              Truong du lieu con thieu: {runtimeData.dataQuality.missingFields.join(", ")}.
            </p>
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
