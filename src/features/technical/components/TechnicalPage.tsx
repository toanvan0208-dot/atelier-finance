import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { pvtDataQuality, pvtObservationData } from "../data/pvtObservation.data";
import type { PVTObservationData, TechnicalIssuerMetadata, TechnicalMarketDataSource } from "../types";
import type { MarketPvtUnitMetadataMap } from "../lib/market-pvt-unit-metadata-contract";
import { PVTConfirmationScenarios } from "./PVTConfirmationScenarios";
import { PVTFinalConclusion } from "./PVTFinalConclusion";
import { PVTFomoThermometer } from "./PVTFomoThermometer";
import { PVTHeroStatus } from "./PVTHeroStatus";
import { PVTMainChart } from "./PVTMainChart";
import { PVTRiskRewardZone } from "./PVTRiskRewardZone";
import { PVTSignalLayers } from "./PVTSignalLayers";

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
  sourceLabel: sourceType === "sample_static_fallback" ? "sample_static_fallback" : "unavailable",
  dataMode: sourceType === "sample_static_fallback" ? "sample" : "unknown",
  productionApproved: false,
  verificationStatus: sourceType === "sample_static_fallback" ? "static_sample" : "unavailable",
  sharesOutstanding: null,
  sharesUnit: null,
  sharesStatus: "unavailable",
  limitations: [
    sourceType === "sample_static_fallback"
      ? "Static sample issuer metadata is not approved production metadata."
      : "Company/issuer metadata is unavailable for this DB-backed ticker.",
  ],
  warnings: [],
});

const stringOrNull = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

const technicalStatusLabel = (status: string | null | undefined): string => {
  switch (status) {
    case "computed_from_market_price_series":
      return "Đã tính từ chuỗi giá đang hiển thị";
    case "insufficient_data":
      return "Chưa đủ dữ liệu";
    case "static_sample":
    case "presentation_only":
      return "Dữ liệu minh họa";
    case "controlled_local_research":
      return "Dữ liệu nội bộ đã kiểm soát";
    case "local_research_seed":
      return "Dữ liệu nội bộ đã rà soát";
    case "available":
      return "Đã có dữ liệu";
    default:
      return "Nguồn đang được kiểm tra";
  }
};

export function TechnicalPage({ initialRuntimeData, onNavigate }: TechnicalPageProps) {
  if (initialRuntimeData && !initialRuntimeData.data) {
    const requestedTicker =
      initialRuntimeData.marketDataSource?.ticker ??
      initialRuntimeData.issuerMetadata?.ticker ??
      "Chua xac dinh";

    return (
      <div className="mx-auto w-full max-w-[1180px] space-y-5">
        <DataQualityBanner {...initialRuntimeData.dataQuality} />
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
            Chua du du lieu Technical/PVT cho {requestedTicker}
          </p>
          <p className="mt-2">
            He thong khong dung du lieu minh hoa hoac du lieu ticker khac de thay the.
          </p>
          <p className="mt-2">
            Nguon du lieu dang duoc kiem tra; chi dung cho nghien cuu va chua du dieu kien xac nhan san xuat.
          </p>
        </section>
      </div>
    );
  }

  const data = initialRuntimeData?.data ?? pvtObservationData;
  const dataQuality = initialRuntimeData?.dataQuality ?? pvtDataQuality;
  const source = initialRuntimeData?.source ?? {
    sourceType: "sample_static_fallback",
    provider: "sample_static",
    sourceLabel: "sample_static_fallback",
    dataMode: "sample",
    productionApproved: false,
  };
  const fallbackUsed = initialRuntimeData?.fallbackUsed ?? true;
  const marketDataSource = initialRuntimeData?.marketDataSource ?? {
    sourceType: source.sourceType,
    provider:
      source.provider ?? (source.sourceType === "local_db_manual_import" ? "local_import" : "sample_static"),
    sourceLabel: source.sourceLabel,
    dataMode: source.dataMode,
    productionApproved: source.productionApproved,
    fallbackUsed,
    ticker: data.ticker,
    asOf: stringOrNull(dataQuality.asOf),
    dateSpan: {
      from: null,
      to: null,
    },
  };
  const issuerMetadata =
    initialRuntimeData?.issuerMetadata ??
    data.issuerMetadata ??
    fallbackIssuerMetadata(data, source.sourceType);

  const isSnapshotOnly = (data.pvtChartSeries?.points?.count ?? 0) <= 1;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
      <SourceTransparencyStrip
        issuerMetadata={issuerMetadata}
        marketDataSource={marketDataSource}
        pvtChartSeries={data.pvtChartSeries}
        pvtDerivedMetrics={data.pvtDerivedMetrics}
        provenance={initialRuntimeData?.provenance}
      />
      <PVTHeroStatus data={data} />
      
      {isSnapshotOnly ? (
        <section className="rounded-lg border border-warning/20 bg-warning/5 p-6 text-center">
          <h2 className="mb-2 text-base font-bold text-ink">Chưa đủ dữ liệu chuỗi thời gian (Time-Series)</h2>
          <p className="text-sm text-subtle">
            Hệ thống chỉ có một bản ghi giá gần nhất của {data.ticker}. Các phân tích kỹ thuật xu hướng, biểu đồ giá, và các lớp tín hiệu chỉ hiển thị khi có chuỗi thời gian liên tục.
          </p>
        </section>
      ) : (
        <>
          <PVTMainChart
            data={data.chart}
            chartSeries={data.pvtChartSeries}
            supportLabel={data.keyLevels.support}
            resistanceLabel={data.keyLevels.resistance}
          />
          <PVTSignalLayers layers={data.signalLayers} />
          <PVTConfirmationScenarios
            confirmation={data.confirmation}
            invalidation={data.invalidation}
            scenarios={data.scenarios}
          />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <PVTRiskRewardZone data={data.riskReward} />
            <PVTFomoThermometer data={data.fomo} />
          </div>
        </>
      )}

      <PVTFinalConclusion
        conclusion={data.finalConclusion}
        actions={data.nextActions}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function SourceTransparencyStrip({
  issuerMetadata,
  marketDataSource,
  pvtDerivedMetrics,
  pvtChartSeries,
  provenance,
}: {
  issuerMetadata: TechnicalIssuerMetadata;
  marketDataSource: TechnicalMarketDataSource;
  pvtDerivedMetrics: PVTObservationData["pvtDerivedMetrics"];
  pvtChartSeries: PVTObservationData["pvtChartSeries"];
  provenance?: TechnicalPageRuntimeData["provenance"];
}) {
  const sourceText =
    marketDataSource.sourceType === "local_db_manual_import"
      ? marketDataSource.provider === "vnstock"
        ? "Dữ liệu giá tham khảo từ nguồn nghiên cứu"
        : "Nguồn dữ liệu nội bộ đã nhập có kiểm soát"
      : "Dữ liệu minh họa dự phòng";
  const metadataUnavailable =
    issuerMetadata.verificationStatus === "unavailable" ||
    issuerMetadata.verificationStatus === "limited" ||
    issuerMetadata.verificationStatus === "unknown";
  const industryText = issuerMetadata.industry ?? "Chưa có dữ liệu xác minh";
  const sectorText = issuerMetadata.sector ?? "Chưa có dữ liệu xác minh";
  const sharesText =
    issuerMetadata.sharesOutstanding === null || issuerMetadata.sharesOutstanding === undefined
      ? "Số cổ phiếu lưu hành: Chưa đủ dữ liệu"
      : `Số cổ phiếu lưu hành: ${issuerMetadata.sharesOutstanding} ${issuerMetadata.sharesUnit ?? ""}`.trim();
  const metadataText =
    issuerMetadata.verificationStatus === "controlled_local_research"
      ? "Thông tin doanh nghiệp nội bộ đã kiểm soát"
      : issuerMetadata.verificationStatus === "local_research_seed"
      ? "Thông tin doanh nghiệp nội bộ đã rà soát"
      : metadataUnavailable
        ? "Thông tin doanh nghiệp và ngành đang được kiểm tra"
        : "Thông tin doanh nghiệp minh họa, chưa phê duyệt sản xuất";

  return (
    <section
      aria-label="Technical/PVT source transparency"
      className="rounded-[4px] border border-ink/10 bg-surface px-4 py-3 text-xs leading-5 text-muted"
    >
      <p className="mb-2 font-bold uppercase text-subtle">Minh bạch nguồn dữ liệu</p>
      
      {provenance && (
        <div className="mb-4 rounded bg-red-50 p-3 text-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-bold mb-1">Cảnh báo nguồn dữ liệu Market Price (Chưa được phê duyệt production)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Trạng thái: <span className="font-semibold">{provenance.provenanceStatus}</span></li>
            <li>Nguồn: {provenance.dataModeLabel} ({provenance.providerTypeLabel})</li>
            <li>Dữ liệu: {provenance.stalenessStatusLabel} - {provenance.adjustmentStatusLabel}</li>
            {provenance.warningLabels.length > 0 && (
              <li>Vấn đề: {provenance.warningLabels.join(", ")}</li>
            )}
          </ul>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="font-semibold text-ink">
            Nguồn giá và khối lượng: {sourceText}
          </p>
          <p>
            Mã: {marketDataSource.ticker ?? "Chưa xác định"} · Cập nhật đến: {marketDataSource.asOf ?? "Chưa xác định"}
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">{metadataText}</p>
          <p>
            Ngành: {industryText} · Lĩnh vực: {sectorText}
          </p>
          <p>{sharesText}</p>
          {issuerMetadata.verificationStatus === "local_research_seed" ||
          issuerMetadata.verificationStatus === "controlled_local_research" ? (
            <p>Chỉ dùng cho nghiên cứu; chưa đủ điều kiện xác nhận sản xuất.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            Dữ liệu nghiên cứu, chưa phê duyệt sản xuất
          </span>
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            {marketDataSource.fallbackUsed ? "Dữ liệu minh họa dự phòng" : "Dữ liệu nghiên cứu"}
          </span>
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            Thông tin doanh nghiệp: {technicalStatusLabel(issuerMetadata.verificationStatus)}
          </span>
          {pvtDerivedMetrics ? (
            <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
              Chỉ số kỹ thuật: {technicalStatusLabel(pvtDerivedMetrics.dataStatus)}
            </span>
          ) : null}
          {pvtChartSeries ? (
            <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
              Biểu đồ: {technicalStatusLabel(pvtChartSeries.status)}
            </span>
          ) : null}
        </div>
        <p className="lg:col-span-2">
          Chỉ số PVT chỉ được tính từ chuỗi giá đang hiển thị; nếu thiếu dữ liệu, kết quả sẽ để trống.
        </p>
        <p className="lg:col-span-2">
          Biểu đồ phải dùng cùng chuỗi dữ liệu đang hiển thị; dữ liệu chưa đủ sẽ được ghi rõ là chưa khả dụng hoặc chỉ mang tính minh họa.
        </p>
      </div>
    </section>
  );
}
