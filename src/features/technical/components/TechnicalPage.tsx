import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
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
      return "Dữ liệu trình bày";
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
    sourceLabel: "research",
    dataMode: "research",
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
      : "Dữ liệu trình bày dự phòng";
  const metadataUnavailable =
    issuerMetadata.verificationStatus === "unavailable" ||
    issuerMetadata.verificationStatus === "limited" ||
    issuerMetadata.verificationStatus === "unknown";
  const industryText = issuerMetadata.industry ?? "Chưa có dữ liệu xác minh";
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
        : "Thông tin doanh nghiệp dùng dữ liệu trình bày, chưa phê duyệt sản xuất";

  const chartStatus = pvtChartSeries ? technicalStatusLabel(pvtChartSeries.status) : "Đang kiểm tra";
  const metricStatus = pvtDerivedMetrics ? technicalStatusLabel(pvtDerivedMetrics.dataStatus) : "Đang kiểm tra";

  return (
    <section
      aria-label="Technical/PVT source transparency"
      className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.04em] text-slate-500">Độ tin cậy dữ liệu</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Dữ liệu PVT đang ở trạng thái tham khảo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {sourceText}. Mã {marketDataSource.ticker ?? "chưa xác định"}, cập nhật đến{" "}
            {marketDataSource.asOf ?? "chưa xác định"}. PVT chỉ dùng để quan sát, không thay thế phân tích cơ bản.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <StatusPill label="Biểu đồ" value={chartStatus} />
          <StatusPill label="Chỉ số" value={metricStatus} />
          <StatusPill label="Doanh nghiệp" value={technicalStatusLabel(issuerMetadata.verificationStatus)} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
        <span className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">{metadataText}</span>
        <span className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">Ngành: {industryText}</span>
        <span className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">{sharesText}</span>
        {provenance?.warningLabels.length ? (
          <span className="rounded-[6px] border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
            Cần kiểm tra thêm: {provenance.warningLabels.slice(0, 2).join(", ")}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
