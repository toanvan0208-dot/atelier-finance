"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
} from "@/components/ui";
import {
  fetchFinancialStatementsByTicker,
  FinancialsApiError,
  type FinancialsApiStatement,
} from "@/lib/data-sources/financials-api-client";
import { financialReadingDeskData } from "../data/financialReadingDesk.data";
import { financialsPageData } from "../data/financials.data";
import { buildFinancialReadingDeskData } from "../lib/build-financial-reading-desk-data";
import {
  financialsTickerMatches,
  normalizeFinancialsTicker,
} from "../lib/financials-data-audit";
import type { FinancialsRuntimeData } from "../lib/financials-runtime-types";
import type { FinancialReadingDeskData, FinancialsPageData } from "../types";
import { FinancialReadingJourney } from "./FinancialReadingJourney";
import { FinancialsDisclaimer } from "./FinancialsDisclaimer";
import { FinancialsHeader } from "./FinancialsHeader";
import { FinancialsOverviewPanel } from "./FinancialsOverviewPanel";
import type { PortfolioReadinessItem } from "@/features/watchlist/lib/load-portfolio-readiness";

type FinancialsPageProps = {
  initialRuntimeData?: FinancialsRuntimeData;
  reviewedReadiness?: PortfolioReadinessItem | null;
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
  | {
      status: "ready";
      statement: FinancialsApiStatement;
      deskData: FinancialReadingDeskData;
      pageData: FinancialsPageData;
    }
  | { status: "empty"; ticker: string }
  | { status: "error"; ticker: string; message: string };

const navigationChangeEvent = "app:navigation";

const useFinancialsTickerFromUrl = () =>
  useSyncExternalStore(
    (callback) => {
      const timeoutId = window.setTimeout(callback, 0);
      window.addEventListener("popstate", callback);
      window.addEventListener(navigationChangeEvent, callback);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("popstate", callback);
        window.removeEventListener(navigationChangeEvent, callback);
      };
    },
    () => normalizeFinancialsTicker(new URLSearchParams(window.location.search).get("ticker")),
    () => null,
  );

const bridgeStateTicker = (state: FinancialsBridgeState): string | null => {
  if (state.status === "runtime") return state.runtimeData.source.ticker;
  if (state.status === "ready") return state.statement.metadata.ticker;
  if (state.status === "loading" || state.status === "empty" || state.status === "error") {
    return state.ticker;
  }
  return null;
};

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

const reviewedAvailableFields = (
  readiness?: PortfolioReadinessItem | null,
): string[] =>
  (["totalDebt", "eps", "sharesOutstanding"] as const).filter(
    (field) => readiness?.sourceDecisions[field].status === "available",
  );

const reconcileReviewedInputs = (
  deskData: FinancialReadingDeskData,
  readiness?: PortfolioReadinessItem | null,
): FinancialReadingDeskData => {
  const availableFields = reviewedAvailableFields(readiness);
  if (availableFields.length === 0) return deskData;

  const missing = deskData.valuationReadiness.missing.filter(
    (item) => !availableFields.some((field) => item.includes(field)),
  );
  const warnings = deskData.warnings.filter(
    (warning) =>
      !availableFields.some((field) => warning.cause.includes(field)),
  );
  const hasReviewedValuationInputs =
    availableFields.includes("eps") &&
    availableFields.includes("sharesOutstanding");

  return {
    ...deskData,
    warnings,
    valuationReadiness: {
      ...deskData.valuationReadiness,
      missing,
      reason: hasReviewedValuationInputs
        ? "Đã có EPS và số cổ phiếu từ bản ghi đã rà soát. Giá thị trường và điều kiện căn chỉnh được kiểm tra tại module Định giá."
        : deskData.valuationReadiness.reason,
      nextStepSuggestion: hasReviewedValuationInputs
        ? "Mở module Định giá để kiểm tra giá thị trường, kỳ dữ liệu và trạng thái từng chỉ số."
        : deskData.valuationReadiness.nextStepSuggestion,
    },
  };
};

const readinessToHeaderStatus = (
  readiness: FinancialsApiStatement["metadata"]["readiness"],
) => {
  if (readiness === "ready")
    return "Đầy đủ" as FinancialsPageData["header"]["dataStatus"];
  if (readiness === "not_ready" || readiness === "insufficient_data") {
    return "Thiếu dữ liệu" as FinancialsPageData["header"]["dataStatus"];
  }
  return "Cần kiểm tra thêm" as FinancialsPageData["header"]["dataStatus"];
};

const runtimeStatusToHeaderStatus = (
  status: FinancialsRuntimeData["dataQuality"]["status"],
) => {
  if (status === "available")
    return "Đầy đủ" as FinancialsPageData["header"]["dataStatus"];
  if (status === "partial" || status === "insufficient_data") {
    return "Thiếu dữ liệu" as FinancialsPageData["header"]["dataStatus"];
  }
  return "Cần kiểm tra thêm" as FinancialsPageData["header"]["dataStatus"];
};

const filterLogicDeskData = (
  data: FinancialReadingDeskData,
  extraWarnings: FinancialReadingDeskData["warnings"] = [],
): FinancialReadingDeskData => {
  const metrics = data.metrics.filter((metric) =>
    logicMetricIds.has(metric.id),
  );
  const metricIds = new Set(metrics.map((metric) => metric.id));
  const readingSteps = data.readingSteps.map((step) => ({
    ...step,
    metricIds: step.metricIds.filter((metricId) => metricIds.has(metricId)),
  }));
  const firstMetricStep =
    readingSteps.find((step) => step.metricIds.length > 0)?.id ??
    data.nextReadingStep.stepId;

  return {
    ...data,
    metrics,
    readingSteps,
    warnings: [
      ...extraWarnings,
      ...data.warnings.filter((warning) => warning.id.startsWith("data-quality-")),
    ].filter(
      (warning, index, warnings) =>
        warnings.findIndex((item) => item.id === warning.id) === index,
    ),
    nextReadingStep: {
      stepId: firstMetricStep,
      title: "Kiểm tra dữ liệu tài chính hiện có",
      reason:
        "Đọc các chỉ số có trạng thái rõ và giữ trường còn thiếu ở trạng thái Chưa đủ dữ liệu.",
    },
    cashQuality: {
      ...data.cashQuality,
      summary:
        "Đối chiếu lợi nhuận với dòng tiền hoạt động và dòng tiền tự do khi các trường cần thiết đã có dữ liệu.",
    },
    riskCheck: {
      ...data.riskCheck,
      summary:
        "Chỉ đánh giá nợ vay, vốn chủ và thanh khoản khi đúng trường dữ liệu và đơn vị đã được xác nhận.",
    },
  };
};

const buildBridgeDeskData = (
  statement: FinancialsApiStatement,
): FinancialReadingDeskData => {
  const next = buildFinancialReadingDeskData(
    financialReadingDeskData,
    statement.snapshot,
  );
  const firstMetricStep =
    next.readingSteps.find((step) =>
      step.metricIds.some((metricId) => logicMetricIds.has(metricId)),
    )?.id ?? next.nextReadingStep.stepId;
  const sourceWarnings = [
    ...(statement.metadata.warningCodes.length > 0
      ? [
          {
            id: "api-source-warnings",
            title: "Dữ liệu cần rà soát",
            severity: "watch" as const,
            summary: `Nguồn dữ liệu có ${statement.metadata.warningCodes.length} cảnh báo cần kiểm tra.`,
            cause: "Nguồn hoặc trạng thái dữ liệu chưa hoàn chỉnh.",
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
            summary: `Nguồn hiện tại còn thiếu ${statement.dataQuality.missingFields.length} trường dữ liệu.`,
            cause: "Các trường thiếu được giữ là Chưa đủ dữ liệu, không thay bằng 0.",
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
    industry: statement.snapshot.companyType ?? "Chưa đủ dữ liệu",
    reportPeriod: statement.metadata.period,
    dataStatus: readinessToHeaderStatus(statement.metadata.readiness),
    previousModuleLink:
      "Dữ liệu đang được đọc từ bản ghi đã lưu trong hệ thống và vẫn giữ trạng thái nghiên cứu.",
  },
  disclaimer: {
    ...financialsPageData.disclaimer,
  },
});

const buildRuntimeDeskData = (
  runtimeData: FinancialsRuntimeData,
): FinancialReadingDeskData | null => {
  if (!runtimeData.statementSnapshot) return null;

  const next = buildFinancialReadingDeskData(
    financialReadingDeskData,
    runtimeData.statementSnapshot,
  );
  const firstMetricStep =
    next.readingSteps.find((step) =>
      step.metricIds.some((metricId) => logicMetricIds.has(metricId)),
    )?.id ?? next.nextReadingStep.stepId;
  const sourceWarnings =
    runtimeData.dataQuality.missingFields.length > 0
      ? [
          {
            id: "runtime-missing-fields",
            title: "Thiếu trường dữ liệu",
            severity: "watch" as const,
            summary: `Nguồn hiện tại còn thiếu ${runtimeData.dataQuality.missingFields.length} trường dữ liệu.`,
            cause: "Các trường thiếu được giữ là Chưa đủ dữ liệu, không thay bằng 0.",
            targetStepId: firstMetricStep,
          },
        ]
      : [];
  const filtered = filterLogicDeskData(next, sourceWarnings);

  return {
    ...filtered,
    ticker: runtimeData.statementSnapshot.ticker ?? runtimeData.source.ticker,
    companyName:
      runtimeData.statementSnapshot.ticker ?? runtimeData.source.ticker,
    period:
      runtimeData.statementSnapshot.period ??
      (runtimeData.source.fiscalYear
        ? String(runtimeData.source.fiscalYear)
        : "Chưa đủ dữ liệu"),
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
    industry:
      runtimeData.statementSnapshot?.companyType ??
      runtimeData.statementSnapshot?.industry ??
      "Chưa đủ dữ liệu",
    reportPeriod:
      runtimeData.statementSnapshot?.period ??
      (runtimeData.source.fiscalYear
        ? String(runtimeData.source.fiscalYear)
        : "Chưa đủ dữ liệu"),
    dataStatus: runtimeStatusToHeaderStatus(runtimeData.dataQuality.status),
    previousModuleLink:
      runtimeData.runtimeStatus === "db_backed"
        ? "Đang đọc dữ liệu tài chính trong hệ thống cho mục đích nghiên cứu; chưa phê duyệt sản xuất."
        : "Chưa đủ dữ liệu đã xác minh; không hiển thị số liệu minh họa như dữ liệu thật.",
  },
  disclaimer: {
    ...financialsPageData.disclaimer,
  },
});

const buildRuntimeState = (
  runtimeData: FinancialsRuntimeData,
): RuntimeReadyState => {
  const deskData = buildRuntimeDeskData(runtimeData);

  return {
    status: "runtime",
    runtimeData,
    deskData,
    pageData: buildRuntimePageData(runtimeData, deskData),
  };
};

export function FinancialsPage({
  initialRuntimeData,
  reviewedReadiness,
  onNavigate,
}: FinancialsPageProps) {
  const tickerFromUrl = useFinancialsTickerFromUrl();
  const [tickerInput, setTickerInput] = useState(
    initialRuntimeData?.source.ticker ?? "FPT",
  );
  const [request, setRequest] = useState<{ ticker: string; id: number } | null>(
    null,
  );
  const [bridgeState, setBridgeState] = useState<FinancialsBridgeState>(() =>
    initialRuntimeData
      ? buildRuntimeState(initialRuntimeData)
      : { status: "empty", ticker: "FPT" },
  );
  const [activeStepId, setActiveStepId] = useState(() =>
    bridgeState.status === "runtime"
      ? (bridgeState.deskData?.nextReadingStep.stepId ??
        financialReadingDeskData.nextReadingStep.stepId)
      : financialReadingDeskData.nextReadingStep.stepId,
  );
  const urlRequestTicker =
    tickerFromUrl &&
    !financialsTickerMatches(tickerFromUrl, bridgeStateTicker(bridgeState))
      ? tickerFromUrl
      : null;

  useEffect(() => {
    const activeTicker = request?.ticker ?? urlRequestTicker;
    if (!activeTicker) return;

    let isActive = true;

    fetchFinancialStatementsByTicker({ ticker: activeTicker, limit: 2 })
      .then((statements) => {
        if (!isActive) return;
        const statement = statements[0];
        if (!statement) {
          setTickerInput(activeTicker);
          setRequest(null);
          setBridgeState({ status: "empty", ticker: activeTicker });
          return;
        }

        if (
          !financialsTickerMatches(activeTicker, statement.metadata.ticker) ||
          !financialsTickerMatches(activeTicker, statement.snapshot.ticker)
        ) {
          setTickerInput(activeTicker);
          setRequest(null);
          setBridgeState({
            status: "error",
            ticker: activeTicker,
            message:
              "Dữ liệu trả về không khớp mã đang chọn nên đã bị chặn.",
          });
          return;
        }

        const deskData = buildBridgeDeskData(statement);
        const pageData = buildBridgePageData(statement, deskData);
        setTickerInput(activeTicker);
        setRequest(null);
        setActiveStepId(deskData.nextReadingStep.stepId);
        setBridgeState({ status: "ready", statement, deskData, pageData });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof FinancialsApiError
            ? error.message
            : "Unable to load persisted financial statements.";
        setTickerInput(activeTicker);
        setRequest(null);
        setBridgeState({ status: "error", ticker: activeTicker, message });
      });

    return () => {
      isActive = false;
    };
  }, [request, urlRequestTicker]);

  const focusStep = (stepId: string) => {
    setActiveStepId(stepId);
    window.setTimeout(() => {
      document
        .getElementById("financial-reading-journey")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const submitTicker = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTicker = tickerInput.trim().toUpperCase();
    if (!nextTicker) return;
    const url = new URL(window.location.href);
    url.searchParams.set("ticker", nextTicker);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
    setBridgeState({ status: "loading", ticker: nextTicker });
    setRequest((current) => ({
      ticker: nextTicker,
      id: (current?.id ?? 0) + 1,
    }));
  };

  const renderFinancialsExperience = (
    deskData: FinancialReadingDeskData,
    pageData: FinancialsPageData,
  ) => {
    const matchingReadiness = financialsTickerMatches(
      pageData.header.ticker,
      reviewedReadiness?.ticker,
    )
      ? reviewedReadiness
      : null;
    const reconciledDeskData = reconcileReviewedInputs(
      deskData,
      matchingReadiness,
    );

    return (
      <>
        <FinancialsHeader
          canContinueToValuation={
            reconciledDeskData.valuationReadiness.canContinue
          }
          data={pageData.header}
          onNavigate={onNavigate}
          valuationDisabledReason={reconciledDeskData.valuationReadiness.reason}
          valuationReadinessCaption={
            reconciledDeskData.valuationReadiness.nextStepSuggestion
          }
          valuationReadinessStatus={
            reconciledDeskData.valuationReadiness.logicStatus
          }
        />
        <FinancialsOverviewPanel
          data={reconciledDeskData}
          onFocusStep={focusStep}
        />
        <FinancialReadingJourney
          activeStepId={activeStepId}
          data={reconciledDeskData}
          onActiveStepChange={setActiveStepId}
        />
        <FinancialsDisclaimer data={pageData.disclaimer} />
      </>
    );
  };

  if (
    tickerFromUrl &&
    !financialsTickerMatches(tickerFromUrl, bridgeStateTicker(bridgeState))
  ) {
    return (
      <div className="mx-auto w-full max-w-[1080px] space-y-6">
        <LoadingState
          description={`Đang chuyển sang dữ liệu tài chính của ${tickerFromUrl}; dữ liệu ticker khác không được hiển thị thay thế.`}
          title="Đang kiểm tra đúng mã doanh nghiệp"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <Card>
        <CardBody>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            onSubmit={submitTicker}
          >
            <div>
              <p className="text-xs font-bold uppercase text-muted">
                Nguồn dữ liệu tài chính
              </p>
              <label
                className="mt-2 block text-sm font-extrabold text-ink"
                htmlFor="financials-ticker-input"
              >
                Mã doanh nghiệp
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="financials-ticker-input"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
              />
            </div>
            <Button
              isLoading={bridgeState.status === "loading"}
              type="submit"
              variant="secondary"
            >
              Kiểm tra dữ liệu
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Đang kiểm tra dữ liệu tài chính đã có cho ${bridgeState.ticker}.`}
          title="Đang tải dữ liệu tài chính"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Chưa đủ dữ liệu tài chính cho ${bridgeState.ticker}. Hệ thống không dùng dữ liệu minh họa của mã khác để thay thế.`}
          icon="F"
          title="Chưa đủ dữ liệu"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Hệ thống không dùng dữ liệu minh họa của mã khác để thay thế.`}
          icon="!"
          title={`Chưa thể đọc dữ liệu tài chính cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "runtime" ? (
        <>
          {bridgeState.deskData && bridgeState.pageData ? (
            renderFinancialsExperience(
              bridgeState.deskData,
              bridgeState.pageData,
            )
          ) : (
            <EmptyState
              description="Chưa đủ dữ liệu tài chính để hiển thị các chỉ tiêu. Dữ liệu thiếu được giữ nguyên, không thay bằng 0."
              icon="F"
              title="Chưa đủ dữ liệu"
            />
          )}
        </>
      ) : null}

      {bridgeState.status === "ready" ? (
        <>
          {renderFinancialsExperience(
            bridgeState.deskData,
            bridgeState.pageData,
          )}
        </>
      ) : null}
    </div>
  );
}
