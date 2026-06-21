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
    provider?: "vnstock" | "sample_static";
    sourceLabel: string;
    dataMode: string;
    productionApproved: false;
  };
  marketDataSource?: TechnicalMarketDataSource;
  marketUnitMetadata?: MarketPvtUnitMetadataMap;
  issuerMetadata?: TechnicalIssuerMetadata;
  fallbackUsed?: boolean;
  warnings?: string[];
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
  limitations: [
    sourceType === "sample_static_fallback"
      ? "Static sample issuer metadata is not verified production metadata."
      : "Company/issuer metadata is unavailable for this DB-backed ticker.",
  ],
  warnings: [],
});

const stringOrNull = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

export function TechnicalPage({ initialRuntimeData, onNavigate }: TechnicalPageProps) {
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
    provider: source.sourceType === "local_db_manual_import" ? "vnstock" : "sample_static",
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

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <DataQualityBanner {...dataQuality} />
      <SourceTransparencyStrip
        issuerMetadata={issuerMetadata}
        marketDataSource={marketDataSource}
        pvtChartSeries={data.pvtChartSeries}
        pvtDerivedMetrics={data.pvtDerivedMetrics}
      />
      <PVTHeroStatus data={data} />
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
}: {
  issuerMetadata: TechnicalIssuerMetadata;
  marketDataSource: TechnicalMarketDataSource;
  pvtDerivedMetrics: PVTObservationData["pvtDerivedMetrics"];
  pvtChartSeries: PVTObservationData["pvtChartSeries"];
}) {
  const sourceText =
    marketDataSource.sourceType === "local_db_manual_import"
      ? `Local DB manual import · ${marketDataSource.sourceLabel} · ${marketDataSource.dataMode}`
      : `Sample/static fallback · ${marketDataSource.dataMode}`;
  const metadataUnavailable =
    issuerMetadata.verificationStatus === "unavailable" ||
    issuerMetadata.verificationStatus === "limited" ||
    issuerMetadata.verificationStatus === "unknown";
  const industryText = issuerMetadata.industry ?? "chua co du lieu xac minh";
  const sectorText = issuerMetadata.sector ?? "chua co du lieu xac minh";
  const metadataText =
    issuerMetadata.verificationStatus === "local_research_seed"
      ? "Metadata doanh nghiep: local research seed"
      : metadataUnavailable
        ? "Metadata doanh nghiep/nganh chua duoc xac minh"
        : "Metadata sample/static, productionApproved:false";

  return (
    <section
      aria-label="Technical/PVT source transparency"
      className="rounded-[4px] border border-ink/10 bg-surface px-4 py-3 text-xs leading-5 text-muted"
    >
      <p className="mb-2 font-bold uppercase text-subtle">Source transparency</p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="font-semibold text-ink">
            Price/volume source: {sourceText}
          </p>
          <p>
            Ticker: {marketDataSource.ticker ?? "unknown"} · asOf: {marketDataSource.asOf ?? "unknown"}
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">{metadataText}</p>
          <p>
            Metadata: {issuerMetadata.verificationStatus} · Industry: {industryText} · Sector: {sectorText}
          </p>
          {issuerMetadata.verificationStatus === "local_research_seed" ? (
            <p>Chi dung cho academic/local research; productionApproved:false</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            productionApproved:{String(marketDataSource.productionApproved)}
          </span>
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            {marketDataSource.fallbackUsed ? "sampleFallback" : "researchOnly"}
          </span>
          <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
            metadata:{issuerMetadata.verificationStatus}
          </span>
          {pvtDerivedMetrics ? (
            <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
              derived:{pvtDerivedMetrics.dataStatus}
            </span>
          ) : null}
          {pvtChartSeries ? (
            <span className="rounded-[3px] border border-ink/10 bg-muted/10 px-2 py-1 font-bold text-ink">
              chart:{pvtChartSeries.status}
            </span>
          ) : null}
        </div>
        <p className="lg:col-span-2">
          Derived PVT metrics are computed only from the active market price series; unavailable when insufficient.
        </p>
        <p className="lg:col-span-2">
          Chart series must come from the active market price series or stay clearly marked as unavailable/static_sample/presentation_only.
        </p>
      </div>
    </section>
  );
}
