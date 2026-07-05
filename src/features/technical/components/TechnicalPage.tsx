import { pvtDataQuality, pvtObservationData } from "../data/pvtObservation.data";
import type { PVTObservationData, TechnicalIssuerMetadata, TechnicalMarketDataSource } from "../types";
import type { MarketPvtUnitMetadataMap } from "../lib/market-pvt-unit-metadata-contract";
import { PVTFinalConclusion } from "./PVTFinalConclusion";
import { PVTHeroStatus } from "./PVTHeroStatus";
import { PVTTimeframeAnalysis } from "./PVTTimeframeAnalysis";

export type TechnicalPageRuntimeData = {
  data: PVTObservationData | null;
  dataQuality: typeof pvtDataQuality;
  source?: {
    sourceType: "local_db_manual_import" | "sample_static_fallback";
    provider?: "local_import" | "vnstock" | "sample_static";
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
  };
  marketDataSource?: TechnicalMarketDataSource;
  marketUnitMetadata?: MarketPvtUnitMetadataMap;
  issuerMetadata?: TechnicalIssuerMetadata;
  fallbackUsed?: boolean;
  warnings?: string[];
  provenance?: {
    ticker: string;
    provenanceStatus: string;
    sourceLabel: string;
    dataModeLabel: string;
    productionApproved: boolean;
    needsReview: boolean;
    providerTypeLabel: string;
    adjustmentStatusLabel: string;
    stalenessStatusLabel: string;
    warningLabels: string[];
    latestMarketDate: string | null;
    rowCount: number;
  };
};

type TechnicalPageProps = {
  initialRuntimeData?: TechnicalPageRuntimeData;
  onNavigate: (key: string) => void;
};

const fallbackIssuerMetadata = (
  data: PVTObservationData,
  sourceType: "local_db_manual_import" | "sample_static_fallback",
): TechnicalIssuerMetadata => ({
  ticker: data.ticker,
  displayName: sourceType === "sample_static_fallback" ? data.companyName : null,
  issuerName: sourceType === "sample_static_fallback" ? data.companyName : null,
  industry: sourceType === "sample_static_fallback" ? data.industry : null,
  sector: null,
  sourceLabel: sourceType === "sample_static_fallback" ? "research" : "unavailable",
  dataMode: sourceType === "sample_static_fallback" ? "research" : "unknown",
  productionApproved: false,
  verificationStatus: sourceType === "sample_static_fallback" ? "static_sample" : "unavailable",
  sharesOutstanding: null,
  sharesUnit: null,
  sharesStatus: "unavailable",
  limitations: [
    sourceType === "sample_static_fallback"
      ? "Thông tin doanh nghiệp dùng dữ liệu trình bày, chưa phê duyệt sản xuất."
      : "Thông tin doanh nghiệp chưa khả dụng cho mã này.",
  ],
  warnings: [],
});

export function TechnicalPage({ initialRuntimeData, onNavigate }: TechnicalPageProps) {
  if (initialRuntimeData && !initialRuntimeData.data) {
    const requestedTicker =
      initialRuntimeData.marketDataSource?.ticker ??
      initialRuntimeData.issuerMetadata?.ticker ??
      "Chưa xác định";

    return (
      <div className="mx-auto w-full max-w-[1180px] space-y-5">
        <section
          aria-label="Technical/PVT unavailable"
          className="rounded-[4px] border border-ink/10 bg-surface px-5 py-5 text-sm leading-6 text-muted"
        >
          {initialRuntimeData.provenance && (
            <div className="mb-4 rounded bg-red-50 p-3 text-red-900 dark:bg-red-950/30 dark:text-red-200">
              <p className="font-bold mb-1">Cảnh báo nguồn dữ liệu Market Price (Chưa được phê duyệt production)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Trạng thái: <span className="font-semibold">{initialRuntimeData.provenance.provenanceStatus}</span></li>
                <li>Nguồn: {initialRuntimeData.provenance.dataModeLabel} ({initialRuntimeData.provenance.providerTypeLabel})</li>
                <li>Dữ liệu: {initialRuntimeData.provenance.stalenessStatusLabel} - {initialRuntimeData.provenance.adjustmentStatusLabel}</li>
                {initialRuntimeData.provenance.warningLabels.length > 0 && (
                  <li>Vấn đề: {initialRuntimeData.provenance.warningLabels.join(", ")}</li>
                )}
              </ul>
            </div>
          )}
          <p className="text-base font-bold text-ink">
            Chưa đủ dữ liệu Technical/PVT cho {requestedTicker}
          </p>
          <p className="mt-2">
            Hệ thống không dùng dữ liệu minh họa hoặc dữ liệu ticker khác để thay thế.
          </p>
          <p className="mt-2">
            Nguồn dữ liệu đang được kiểm tra; chỉ dùng cho nghiên cứu và chưa đủ điều kiện xác nhận sản xuất.
          </p>
        </section>
      </div>
    );
  }

  const data = initialRuntimeData?.data ?? pvtObservationData;
  const isSnapshotOnly = (data.pvtChartSeries?.points?.count ?? 0) <= 1;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <PVTHeroStatus data={data} />
      
      {isSnapshotOnly ? (
        <section className="rounded-[8px] border border-amber-300 bg-amber-50 p-6 shadow-[0_16px_40px_rgba(180,83,9,0.08)]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Cần thêm dữ liệu</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Chưa đủ chuỗi thời gian để vẽ nhịp PVT</h2>
            <p className="mt-3 text-sm leading-6 text-amber-950">
              Hệ thống mới có bản ghi giá gần nhất của {data.ticker}. Khi có chuỗi giá liên tục, biểu đồ,
              thanh khoản và các lớp quan sát sẽ mở ra đầy đủ hơn.
            </p>
          </div>
        </section>
      ) : (
        <PVTTimeframeAnalysis data={data} />
      )}

      <PVTFinalConclusion
        conclusion={data.finalConclusion}
        actions={data.nextActions}
        onNavigate={onNavigate}
      />
    </div>
  );
}
