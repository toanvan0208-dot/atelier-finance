"use client";

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
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";
import type { FinancialReadingDeskData, FinancialsPageData } from "../types";
import { FinancialReadingJourney } from "./FinancialReadingJourney";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsOverviewPanel } from "./FinancialsOverviewPanel";
import { FinancialsSourceTransparency } from "./FinancialsSourceTransparency";

type FinancialsPageProps = {
  initialRuntimeData?: FinancialsRuntimeData;
  onNavigate?: (moduleKey: string) => void;
};

type RuntimeReadyState = {
  status: "runtime";
  runtimeData: FinancialsRuntimeData;
  deskData: FinancialReadingDeskData | null;
  pageData: FinancialsPageData | null;
};

type FinancialsBridgeState =
  | { status: "loading"; ticker: string }
  | RuntimeReadyState
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
  if (readiness === "ready") return "Day du" as FinancialsPageData["header"]["dataStatus"];
  if (readiness === "not_ready" || readiness === "insufficient_data") {
    return "Thieu du lieu" as FinancialsPageData["header"]["dataStatus"];
  }
  return "Can kiem tra them" as FinancialsPageData["header"]["dataStatus"];
};

const runtimeStatusToHeaderStatus = (status: FinancialsRuntimeData["dataQuality"]["status"]) => {
  if (status === "available") return "Day du" as FinancialsPageData["header"]["dataStatus"];
  if (status === "partial" || status === "insufficient_data") {
    return "Thieu du lieu" as FinancialsPageData["header"]["dataStatus"];
  }
  return "Can kiem tra them" as FinancialsPageData["header"]["dataStatus"];
};

const filterLogicDeskData = (
  data: FinancialReadingDeskData,
  extraWarnings: FinancialReadingDeskData["warnings"] = [],
): FinancialReadingDeskData => {
  const metrics = data.metrics.filter((metric) => logicMetricIds.has(metric.id));
  const metricIds = new Set(metrics.map((metric) => metric.id));
  const readingSteps = data.readingSteps.map((step) => ({
    ...step,
    metricIds: step.metricIds.filter((metricId) => metricIds.has(metricId)),
  }));
  const firstMetricStep = readingSteps.find((step) => step.metricIds.length > 0)?.id ?? data.nextReadingStep.stepId;

  return {
    ...data,
    metrics,
    readingSteps,
    warnings: [...extraWarnings, ...data.warnings].filter(
      (warning, index, warnings) => warnings.findIndex((item) => item.id === warning.id) === index,
    ),
    nextReadingStep: {
      ...data.nextReadingStep,
      stepId: firstMetricStep,
    },
  };
};

const buildBridgeDeskData = (statement: FinancialsApiStatement): FinancialReadingDeskData => {
  const next = buildFinancialReadingDeskData(financialReadingDeskData, statement.snapshot);
  const firstMetricStep =
    next.readingSteps.find((step) => step.metricIds.some((metricId) => logicMetricIds.has(metricId)))?.id ??
    next.nextReadingStep.stepId;
  const sourceWarnings = [
    ...(statement.metadata.warningCodes.length > 0
      ? [
          {
            id: "api-source-warnings",
            title: "Du lieu can ra soat",
            severity: "watch" as const,
            summary: `Nguon du lieu co ${statement.metadata.warningCodes.length} canh bao metadata.`,
            cause: statement.metadata.warningCodes.join(", "),
            targetStepId: firstMetricStep,
          },
        ]
      : []),
    ...(statement.dataQuality.missingFields?.length
      ? [
          {
            id: "api-missing-fields",
            title: "Thieu truong du lieu",
            severity: "watch" as const,
            summary: `API tra ve ${statement.dataQuality.missingFields.length} truong con thieu.`,
            cause: statement.dataQuality.missingFields.join(", "),
            targetStepId: firstMetricStep,
          },
        ]
      : []),
  ];

  return {
    ...filterLogicDeskData(next, sourceWarnings),
    ticker: statement.snapshot.ticker ?? statement.metadata.ticker,
    companyName: statement.snapshot.ticker ?? statement.metadata.ticker,
    period: statement.snapshot.period ?? statement.metadata.period,
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
      "Du lieu BCTC dang duoc doc tu API noi bo va database local. Khong dung fallback mock khi API loi hoac rong.",
  },
  disclaimer: {
    ...financialsPageData.disclaimer,
  },
});

const buildRuntimeDeskData = (runtimeData: FinancialsRuntimeData): FinancialReadingDeskData | null => {
  if (!runtimeData.statementSnapshot) return null;

  const next = buildFinancialReadingDeskData(financialReadingDeskData, runtimeData.statementSnapshot);
  const firstMetricStep =
    next.readingSteps.find((step) => step.metricIds.some((metricId) => logicMetricIds.has(metricId)))?.id ??
    next.nextReadingStep.stepId;
  const sourceWarnings =
    runtimeData.dataQuality.missingFields.length > 0
      ? [
          {
            id: "runtime-missing-fields",
            title: "Thieu truong du lieu",
            severity: "watch" as const,
            summary: `Runtime financials con thieu ${runtimeData.dataQuality.missingFields.length} truong.`,
            cause: runtimeData.dataQuality.missingFields.join(", "),
            targetStepId: firstMetricStep,
          },
        ]
      : [];
  const filtered = filterLogicDeskData(next, sourceWarnings);

  return {
    ...filtered,
    ticker: runtimeData.statementSnapshot.ticker ?? runtimeData.source.ticker,
    companyName: runtimeData.statementSnapshot.ticker ?? runtimeData.source.ticker,
    period:
      runtimeData.statementSnapshot.period ??
      (runtimeData.source.fiscalYear ? String(runtimeData.source.fiscalYear) : financialReadingDeskData.period),
  };
};

const buildRuntimePageData = (
  runtimeData: FinancialsRuntimeData,
  deskData: FinancialReadingDeskData | null,
): FinancialsPageData => ({
  ...financialsPageData,
  header: {
    ...financialsPageData.header,
    ticker: runtimeData.source.ticker,
    companyName: deskData?.companyName ?? runtimeData.source.ticker,
    industry: runtimeData.statementSnapshot?.companyType ?? runtimeData.statementSnapshot?.industry ?? "unknown",
    reportPeriod:
      runtimeData.statementSnapshot?.period ??
      (runtimeData.source.fiscalYear ? String(runtimeData.source.fiscalYear) : financialsPageData.header.reportPeriod),
    dataStatus: runtimeStatusToHeaderStatus(runtimeData.dataQuality.status),
    previousModuleLink:
      runtimeData.runtimeStatus === "db_backed"
        ? "Dang doc Financials tu local DB research-only qua server runtime boundary; chua phai nguon production."
        : "Dang dung sample fallback; DB-backed financials chi bat khi env flag duoc cau hinh.",
  },
  disclaimer: {
    ...financialsPageData.disclaimer,
  },
});

const buildRuntimeState = (runtimeData: FinancialsRuntimeData): RuntimeReadyState => {
  const deskData = buildRuntimeDeskData(runtimeData);

  return {
    status: "runtime",
    runtimeData,
    deskData,
    pageData: buildRuntimePageData(runtimeData, deskData),
  };
};

export function FinancialsPage({ initialRuntimeData, onNavigate }: FinancialsPageProps) {
  const [tickerInput, setTickerInput] = useState(initialRuntimeData?.source.ticker ?? "FPTLAB");
  const [request, setRequest] = useState<{ ticker: string; id: number } | null>(null);
  const [bridgeState, setBridgeState] = useState<FinancialsBridgeState>(() =>
    initialRuntimeData ? buildRuntimeState(initialRuntimeData) : { status: "empty", ticker: "FPTLAB" },
  );
  const [activeStepId, setActiveStepId] = useState(() =>
    bridgeState.status === "runtime"
      ? bridgeState.deskData?.nextReadingStep.stepId ?? financialReadingDeskData.nextReadingStep.stepId
      : financialReadingDeskData.nextReadingStep.stepId,
  );

  useEffect(() => {
    if (!request) return;

    let isActive = true;
    const activeTicker = request.ticker;

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
  }, [request]);

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
    setBridgeState({ status: "loading", ticker: nextTicker });
    setRequest((current) => ({ ticker: nextTicker, id: (current?.id ?? 0) + 1 }));
  };

  const renderFinancialsExperience = (deskData: FinancialReadingDeskData, pageData: FinancialsPageData) => (
    <>
      <FinancialsHeader
        canContinueToValuation={deskData.valuationReadiness.canContinue}
        data={pageData.header}
        onNavigate={onNavigate}
        valuationDisabledReason={deskData.valuationReadiness.reason}
        valuationReadinessCaption={deskData.valuationReadiness.nextStepSuggestion}
        valuationReadinessStatus={deskData.valuationReadiness.logicStatus}
      />
      <FinancialsOverviewPanel data={deskData} onFocusStep={focusStep} />
      <FinancialReadingJourney activeStepId={activeStepId} data={deskData} onActiveStepChange={setActiveStepId} />
      <FinancialsDisclaimer data={pageData.disclaimer} />
    </>
  );

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
              Tai tu API
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Dang doc du lieu BCTC da persist cho ${bridgeState.ticker}.`}
          title="Dang tai Financials tu API"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Khong co FinancialStatement da persist cho ${bridgeState.ticker}. Khong dung du lieu mock de thay the.`}
          icon="F"
          title="Chua co du lieu Financials trong database"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Khong dung du lieu mock de thay the.`}
          icon="!"
          title={`Khong tai duoc Financials cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "runtime" ? (
        <>
          <FinancialsSourceTransparency runtimeData={bridgeState.runtimeData} />
          <DataQualityBanner
            asOf={bridgeState.runtimeData.source.asOf}
            isDemoData={bridgeState.runtimeData.runtimeStatus !== "db_backed"}
            isStale={false}
            missingFields={bridgeState.runtimeData.dataQuality.missingFields}
            source={bridgeState.runtimeData.source.sourceLabel}
          />
          {bridgeState.deskData && bridgeState.pageData ? (
            renderFinancialsExperience(bridgeState.deskData, bridgeState.pageData)
          ) : (
            <EmptyState
              description="Runtime boundary khong co statement snapshot kha dung; du lieu thieu duoc giu la unavailable."
              icon="F"
              title="Chua co snapshot de hien thi Financials"
            />
          )}
        </>
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
          {renderFinancialsExperience(bridgeState.deskData, bridgeState.pageData)}
        </>
      ) : null}
    </div>
  );
}
