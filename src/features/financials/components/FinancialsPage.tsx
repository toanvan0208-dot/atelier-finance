import { FormEvent, useEffect, useMemo, useState } from "react";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  fetchFinancialStatementsByTicker,
  FinancialsApiError,
  type FinancialsApiStatement,
} from "@/lib/data-sources/financials-api-client";
import { financialReadingDeskData } from "../data/financialReadingDesk.data";
import { financialsPageData } from "../data/financials.data";
import { buildFinancialReadingDeskData } from "../lib/build-financial-reading-desk-data";
import type { FinancialReadingDeskData, FinancialsPageData } from "../types";
import { FinancialReadingJourney } from "./FinancialReadingJourney";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsOverviewPanel } from "./FinancialsOverviewPanel";

type FinancialsPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

type FinancialsBridgeState =
  | { status: "loading" }
  | { status: "ready"; statement: FinancialsApiStatement; deskData: FinancialReadingDeskData; pageData: FinancialsPageData }
  | { status: "empty"; ticker: string }
  | { status: "error"; ticker: string; message: string };

const logicMetricIds = new Set([
  "revenue-growth",
  "gross-margin",
  "net-margin",
  "roa",
  "roe",
  "debt-to-equity",
  "current-ratio",
  "cfo-to-net-profit",
  "fcf",
  "data-quality",
]);

const metadataLabel = (value: string): string => value.replace(/_/g, " ");

const readinessToHeaderStatus = (readiness: FinancialsApiStatement["metadata"]["readiness"]) => {
  if (readiness === "ready") return "Đầy đủ";
  if (readiness === "not_ready" || readiness === "insufficient_data") return "Thiếu dữ liệu";
  return "Cần kiểm tra thêm";
};

const buildBridgeDeskData = (statement: FinancialsApiStatement): FinancialReadingDeskData => {
  const next = buildFinancialReadingDeskData(financialReadingDeskData, statement.snapshot);
  const apiMetrics = next.metrics.filter((metric) => logicMetricIds.has(metric.id));
  const apiMetricIds = new Set(apiMetrics.map((metric) => metric.id));
  const readingSteps = next.readingSteps.map((step) => ({
    ...step,
    metricIds: step.metricIds.filter((metricId) => apiMetricIds.has(metricId)),
  }));
  const firstMetricStep = readingSteps.find((step) => step.metricIds.length > 0)?.id ?? next.nextReadingStep.stepId;
  const sourceWarnings = [
    ...(statement.metadata.warningCodes.length > 0
      ? [
          {
            id: "api-source-warnings",
            title: "Dữ liệu cần rà soát",
            severity: "watch" as const,
            summary: `Nguồn dữ liệu có ${statement.metadata.warningCodes.length} cảnh báo metadata.`,
            cause: statement.metadata.warningCodes.join(", "),
            targetStepId: firstMetricStep,
          },
        ]
      : []),
    ...(statement.dataQuality.missingFields?.length
      ? [
          {
            id: "api-missing-fields",
            title: "Thiếu trường dữ liệu",
            severity: "watch" as const,
            summary: `API trả về ${statement.dataQuality.missingFields.length} trường còn thiếu.`,
            cause: statement.dataQuality.missingFields.join(", "),
            targetStepId: firstMetricStep,
          },
        ]
      : []),
  ];

  return {
    ...next,
    ticker: statement.snapshot.ticker ?? statement.metadata.ticker,
    companyName: statement.snapshot.ticker ?? statement.metadata.ticker,
    period: statement.snapshot.period ?? statement.metadata.period,
    metrics: apiMetrics,
    readingSteps,
    warnings: sourceWarnings,
    nextReadingStep: {
      ...next.nextReadingStep,
      stepId: firstMetricStep,
    },
  };
};

const buildBridgePageData = (
  statement: FinancialsApiStatement,
  deskData: FinancialReadingDeskData,
): FinancialsPageData => ({
  ...financialsPageData,
  header: {
    ...financialsPageData.header,
    ticker: statement.metadata.ticker,
    companyName: deskData.companyName,
    industry: statement.snapshot.companyType ?? "unknown",
    reportPeriod: statement.metadata.period,
    dataStatus: readinessToHeaderStatus(statement.metadata.readiness),
    previousModuleLink:
      "Dữ liệu BCTC đang được đọc từ API nội bộ và database local. Không dùng fallback mock khi API lỗi hoặc rỗng.",
  },
  disclaimer: {
    ...financialsPageData.disclaimer,
  },
});

export function FinancialsPage({ onNavigate }: FinancialsPageProps) {
  const [tickerInput, setTickerInput] = useState("FPTLAB");
  const [request, setRequest] = useState({ ticker: "FPTLAB", id: 0 });
  const [bridgeState, setBridgeState] = useState<FinancialsBridgeState>({ status: "loading" });
  const [activeStepId, setActiveStepId] = useState(financialReadingDeskData.nextReadingStep.stepId);
  const activeTicker = request.ticker;

  useEffect(() => {
    let isActive = true;

    fetchFinancialStatementsByTicker({ ticker: activeTicker, limit: 2 })
      .then((statements) => {
        if (!isActive) return;
        const statement = statements[0];
        if (!statement) {
          setBridgeState({ status: "empty", ticker: activeTicker });
          return;
        }

        const deskData = buildBridgeDeskData(statement);
        const pageData = buildBridgePageData(statement, deskData);
        setActiveStepId(deskData.nextReadingStep.stepId);
        setBridgeState({ status: "ready", statement, deskData, pageData });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof FinancialsApiError
            ? error.message
            : "Unable to load persisted financial statements.";
        setBridgeState({ status: "error", ticker: activeTicker, message });
      });

    return () => {
      isActive = false;
    };
  }, [activeTicker, request.id]);

  const metadataChips = useMemo(() => {
    if (bridgeState.status !== "ready") return [];
    const { metadata } = bridgeState.statement;
    return [
      `dataMode: ${metadataLabel(metadata.dataMode)}`,
      `sourceType: ${metadataLabel(metadata.sourceType)}`,
      `quality: ${metadataLabel(metadata.qualityStatus)}`,
      `readiness: ${metadataLabel(metadata.readiness)}`,
      `fallback: ${String(metadata.fallback)}`,
    ];
  }, [bridgeState]);

  const focusStep = (stepId: string) => {
    setActiveStepId(stepId);
    window.setTimeout(() => {
      document.getElementById("financial-reading-journey")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const submitTicker = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTicker = tickerInput.trim().toUpperCase();
    if (!nextTicker) return;
    setBridgeState({ status: "loading" });
    setRequest((current) => ({ ticker: nextTicker, id: current.id + 1 }));
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <Card>
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" onSubmit={submitTicker}>
            <div>
              <p className="text-xs font-bold uppercase text-muted">Financials API bridge</p>
              <label className="mt-2 block text-sm font-extrabold text-ink" htmlFor="financials-ticker-input">
                Ticker local
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="financials-ticker-input"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
              />
            </div>
            <Button isLoading={bridgeState.status === "loading"} type="submit" variant="secondary">
              Tải từ API
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Đang đọc dữ liệu BCTC đã persist cho ${activeTicker}.`}
          title="Đang tải Financials từ API"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Không có FinancialStatement đã persist cho ${bridgeState.ticker}. Không dùng dữ liệu mock để thay thế.`}
          icon="F"
          title="Chưa có dữ liệu Financials trong database"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Không dùng dữ liệu mock để thay thế.`}
          icon="!"
          title={`Không tải được Financials cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "ready" ? (
        <>
          <DataQualityBanner {...bridgeState.statement.dataQuality} />
          <div className="flex flex-wrap gap-2">
            {metadataChips.map((chip) => (
              <Chip key={chip} variant="neutral">
                {chip}
              </Chip>
            ))}
          </div>
          <FinancialsHeader
            canContinueToValuation={bridgeState.deskData.valuationReadiness.canContinue}
            data={bridgeState.pageData.header}
            onNavigate={onNavigate}
            valuationDisabledReason={bridgeState.deskData.valuationReadiness.reason}
            valuationReadinessCaption={bridgeState.deskData.valuationReadiness.nextStepSuggestion}
            valuationReadinessStatus={bridgeState.deskData.valuationReadiness.logicStatus}
          />
          <FinancialsOverviewPanel data={bridgeState.deskData} onFocusStep={focusStep} />
          <FinancialReadingJourney
            activeStepId={activeStepId}
            data={bridgeState.deskData}
            onActiveStepChange={setActiveStepId}
          />
          <FinancialsDisclaimer data={bridgeState.pageData.disclaimer} />
        </>
      ) : null}
    </div>
  );
}
