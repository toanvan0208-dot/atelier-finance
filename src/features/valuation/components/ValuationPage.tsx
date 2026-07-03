"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  fetchValuationInputsByTicker,
  ValuationApiError,
  type ValuationApiInputs,
} from "@/lib/data-sources/valuation-api-client";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { baseValuationRefactoredData } from "../data/valuationRefactored.data";
import { buildValuationDeskData } from "../lib/build-valuation-desk-data";
import { buildControlledValuationIntegrationBoundary } from "../lib/controlled-valuation-integration-boundary";
import {
  buildValuationUnitAwareReadyMetricsScenario,
  valuationUnitAwareReadyMetricsScenarioId,
  type ValuationUnitAwareReadyMetricsScenarioId,
} from "../lib/valuation-unit-aware-ready-metrics-scenario";
import {
  buildValuationFinancialsRuntimeConsumption,
  type ValuationFinancialsRuntimeConsumption,
} from "../lib/valuation-financials-runtime-consumption";
import type { ValuationRefactoredData } from "../types";
import { ControlledValuationCalculationPanel } from "./ControlledValuationCalculationPanel";
import { ValuationAssumptionPanel } from "./ValuationAssumptionPanel";
import { ValuationFinalConclusion } from "./ValuationFinalConclusion";
import { ValuationMethodSelector } from "./ValuationMethodSelector";
import { ValuationNextStepActions } from "./ValuationNextStepActions";
import { ValuationRangeTable } from "./ValuationRangeTable";
import { ValuationScenarioSafety } from "./ValuationScenarioSafety";
import { ValuationSummaryHero } from "./ValuationSummaryHero";
import { ValuationTrapList } from "./ValuationTrapList";
import { ValuationUncertaintyPanel } from "./ValuationUncertaintyPanel";

type ValuationPageProps = {
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  initialScenario?: ValuationUnitAwareReadyMetricsScenarioId | null;
  onNavigate?: (moduleKey: string) => void;
};

type ValuationBridgeState =
  | { status: "loading"; ticker: string }
  | { status: "ready"; ticker: string; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "insufficient"; ticker: string; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "empty"; ticker: string; missingReasons: string[] }
  | { status: "error"; ticker: string; message: string };

const navigationChangeEvent = "app:navigation";
const defaultValuationTicker = "FPT";

const normalizeTicker = (ticker: string | null | undefined): string | null => {
  const normalized = ticker?.trim().toUpperCase();
  return normalized || null;
};

const tickerMatches = (expected: string | null | undefined, actual: string | null | undefined): boolean => {
  const expectedTicker = normalizeTicker(expected);
  const actualTicker = normalizeTicker(actual);
  return Boolean(expectedTicker && actualTicker && expectedTicker === actualTicker);
};

export function resolveInitialValuationTicker({
  controlledTicker,
  urlTicker,
  runtimeTicker,
}: {
  controlledTicker?: string | null;
  urlTicker?: string | null;
  runtimeTicker?: string | null;
}) {
  return normalizeTicker(controlledTicker) ?? normalizeTicker(urlTicker) ?? normalizeTicker(runtimeTicker) ?? defaultValuationTicker;
}

const readValuationTickerFromLocation = () => {
  if (typeof window === "undefined") return null;

  return normalizeTicker(new URLSearchParams(window.location.search).get("ticker"));
};

const useValuationTickerFromUrl = () => {
  const [ticker, setTicker] = useState<string | null>(() => readValuationTickerFromLocation());

  useEffect(() => {
    const updateTicker = () => setTicker(readValuationTickerFromLocation());

    updateTicker();
    window.addEventListener("popstate", updateTicker);
    window.addEventListener(navigationChangeEvent, updateTicker);

    return () => {
      window.removeEventListener("popstate", updateTicker);
      window.removeEventListener(navigationChangeEvent, updateTicker);
    };
  }, []);

  return ticker;
};

const readableBoundaryValue = (value: string): string => value.replace(/_/g, " ");

const readinessLabel: Record<string, string> = {
  blocked: "Đang chặn theo phạm vi an toàn",
  insufficient_data: "Chưa đủ dữ liệu",
  mixed_source: "Nguồn hỗn hợp, cần kiểm tra",
  not_applicable: "N/A với dữ liệu hiện tại",
  partial: "Một phần",
  ready: "Có thể tính",
  sample_fallback: "Dữ liệu minh họa, không dùng để kết luận",
  unavailable: "Chưa đủ dữ liệu",
};

const userStatus = (value: string): string => readinessLabel[value] ?? readableBoundaryValue(value);

const userFacingSource = (source: string | null | undefined): string => {
  if (!source) return "Chưa đủ dữ liệu nguồn";
  if (source.includes("manual_reviewed_financial_statement")) return "Bản ghi đã rà soát, dùng cho nghiên cứu";
  if (source.includes("vnstock")) return "Dữ liệu giá/khối lượng nghiên cứu";
  if (source.includes("sample")) return "Dữ liệu minh họa, không dùng để kết luận";
  return "Dữ liệu có thông tin nguồn";
};

const buildBridgeData = (result: ValuationApiInputs): ValuationRefactoredData => {
  const data = buildValuationDeskData(baseValuationRefactoredData, result.snapshot);
  const ticker = result.snapshot.ticker ?? result.ticker;

  return {
    ...data,
    summary: {
      ...data.summary,
      ticker,
      companyName: ticker,
    },
  };
};

type ValuationDataQualityView = {
  source?: string | null;
  asOf?: string | Date | null;
  isDemoData?: boolean;
  isResearchOnly?: boolean;
  isStale?: boolean;
  missingFields?: string[];
};

const toBoundaryNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

function ValuationFinancialsRuntimeNote({
  boundary,
  dataQuality,
}: {
  boundary: ValuationFinancialsRuntimeConsumption;
  dataQuality: ValuationDataQualityView | null;
}) {
  const readinessRows = [
    ["P/E", boundary.calculationReadiness.pe],
    ["P/B", boundary.calculationReadiness.pb],
    ["BVPS", boundary.calculationReadiness.bvps],
    ["Vốn hóa", boundary.calculationReadiness.marketCap],
  ] as const;
  const missingCount = dataQuality?.missingFields?.length ?? 0;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="accent">Ghi chú dữ liệu</Chip>
            <Chip variant="neutral">{dataQuality?.isDemoData ? "Dữ liệu minh họa" : "Dữ liệu nghiên cứu"}</Chip>
            {dataQuality?.isStale ? <Chip variant="warning">Cần kiểm tra ngày dữ liệu</Chip> : null}
          </div>
          <p className="mt-3 font-bold text-ink">
            Các tỷ số bên dưới chỉ dùng để tham khảo và học cách đọc định giá, không phải lời khuyên đầu tư.
          </p>
          <p className="mt-1 leading-6">
            {missingCount > 0
              ? `Còn ${missingCount} trường cần kiểm tra, phần thiếu sẽ hiển thị là Chưa đủ dữ liệu hoặc N/A.`
              : "Các đầu vào chính cho tỷ số cơ bản hiện có dữ liệu để đọc."}
          </p>
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {readinessRows.map(([label, value]) => (
              <div className="grid grid-cols-[110px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{userStatus(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function ValuationPage({ initialFinancialsRuntimeData, initialScenario, onNavigate }: ValuationPageProps) {
  const tickerFromUrl = useValuationTickerFromUrl();
  const controlledScenario = useMemo(
    () => (initialScenario === valuationUnitAwareReadyMetricsScenarioId ? buildValuationUnitAwareReadyMetricsScenario() : null),
    [initialScenario],
  );
  const controlledScenarioBridgeState = useMemo<ValuationBridgeState | null>(
    () =>
      controlledScenario
        ? {
            data: buildBridgeData(controlledScenario.valuationApiInputs),
            result: controlledScenario.valuationApiInputs,
            status: "ready",
            ticker: controlledScenario.ticker,
          }
        : null,
    [controlledScenario],
  );
  const initialTicker = resolveInitialValuationTicker({
    controlledTicker: controlledScenario?.ticker,
    urlTicker: tickerFromUrl,
    runtimeTicker: initialFinancialsRuntimeData?.source.ticker,
  });
  const [tickerInput, setTickerInput] = useState(initialTicker);
  const [request, setRequest] = useState({ ticker: initialTicker, id: 0 });
  const [bridgeState, setBridgeState] = useState<ValuationBridgeState>(
    controlledScenarioBridgeState ?? { status: "loading", ticker: initialTicker },
  );
  const bridgeTicker = "ticker" in bridgeState ? bridgeState.ticker : null;
  const urlRequestTicker =
    tickerFromUrl && !tickerMatches(tickerFromUrl, bridgeTicker) ? tickerFromUrl : null;
  const activeTicker = urlRequestTicker ?? request.ticker;
  const effectiveFinancialsRuntimeData =
    controlledScenario?.financialsRuntimeData ??
    (tickerMatches(activeTicker, initialFinancialsRuntimeData?.source.ticker)
      ? initialFinancialsRuntimeData
      : undefined);

  useEffect(() => {
    if (controlledScenario) {
      return;
    }

    let isActive = true;

    fetchValuationInputsByTicker({ ticker: activeTicker })
      .then((result) => {
        if (!isActive) return;
        if (!tickerMatches(activeTicker, result.ticker) || !tickerMatches(activeTicker, result.snapshot.ticker)) {
          setTickerInput(activeTicker);
          setRequest((current) => (tickerMatches(current.ticker, activeTicker) ? current : { ticker: activeTicker, id: current.id }));
          setBridgeState({
            status: "error",
            ticker: activeTicker,
            message: "Dữ liệu trả về không khớp mã đang chọn nên đã bị chặn.",
          });
          return;
        }
        if (result.missingReasons.includes("financial_statement")) {
          setTickerInput(activeTicker);
          setRequest((current) => (tickerMatches(current.ticker, activeTicker) ? current : { ticker: activeTicker, id: current.id }));
          setBridgeState({ status: "empty", ticker: activeTicker, missingReasons: result.missingReasons });
          return;
        }

        const data = buildBridgeData(result);
        setTickerInput(activeTicker);
        setRequest((current) => (tickerMatches(current.ticker, activeTicker) ? current : { ticker: activeTicker, id: current.id }));
        setBridgeState({
          status: result.status === "ready" ? "ready" : "insufficient",
          ticker: activeTicker,
          result,
          data,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message =
          error instanceof ValuationApiError
            ? error.message
            : "Unable to load valuation inputs from persisted data.";
        setTickerInput(activeTicker);
        setRequest((current) => (tickerMatches(current.ticker, activeTicker) ? current : { ticker: activeTicker, id: current.id }));
        setBridgeState({ status: "error", ticker: activeTicker, message });
      });

    return () => {
      isActive = false;
    };
  }, [activeTicker, controlledScenario, request.id]);

  const runtimeConsumption = useMemo(() => {
    const snapshot =
      bridgeState.status === "ready" || bridgeState.status === "insufficient"
        ? bridgeState.result.snapshot
        : null;

    return buildValuationFinancialsRuntimeConsumption({
      financialsRuntimeData: effectiveFinancialsRuntimeData,
      persistedBridgeInputs: {
        eps: snapshot?.eps ?? null,
        equity: snapshot?.totalEquity ?? null,
        bvps: snapshot?.bvps ?? null,
        marketPrice: snapshot?.closePrice ?? null,
        sharesOutstanding: snapshot?.sharesOutstanding ?? null,
      },
    });
  }, [bridgeState, effectiveFinancialsRuntimeData]);

  const controlledCalculationBoundary = (() => {
    const snapshot =
      bridgeState.status === "ready" || bridgeState.status === "insufficient"
        ? bridgeState.result.snapshot
        : null;
    const runtimeSnapshot = effectiveFinancialsRuntimeData?.statementSnapshot;

    return buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: runtimeSnapshot
        ? {
            revenue: runtimeSnapshot.revenue,
            netProfit: runtimeSnapshot.netProfit,
            totalEquity: runtimeSnapshot.totalEquity,
            eps: runtimeSnapshot.eps,
            sharesOutstanding: runtimeSnapshot.sharesOutstanding,
            dataMode: effectiveFinancialsRuntimeData.source.dataMode,
            readPath: effectiveFinancialsRuntimeData.source.readPath,
            runtimeStatus: effectiveFinancialsRuntimeData.runtimeStatus,
            fallbackUsed: effectiveFinancialsRuntimeData.source.fallbackUsed,
            productionApproved: effectiveFinancialsRuntimeData.source.productionApproved,
            sourceLabel: effectiveFinancialsRuntimeData.source.sourceLabel,
            asOf: effectiveFinancialsRuntimeData.source.asOf,
            fiscalYear: effectiveFinancialsRuntimeData.source.fiscalYear,
            period: runtimeSnapshot.period,
            periodType: effectiveFinancialsRuntimeData.source.periodType,
            units: {
              equity: effectiveFinancialsRuntimeData.unitMetadata.equity.unit,
              eps: effectiveFinancialsRuntimeData.unitMetadata.eps.unit,
              netIncome: effectiveFinancialsRuntimeData.unitMetadata.netIncome.unit,
              revenue: effectiveFinancialsRuntimeData.unitMetadata.revenue.unit,
              sharesOutstanding: effectiveFinancialsRuntimeData.unitMetadata.sharesOutstanding.unit,
            },
          }
        : null,
      persistedValuationInputs: snapshot
        ? {
            revenue: toBoundaryNumber(snapshot.revenue),
            netIncome: toBoundaryNumber(snapshot.netProfit),
            equity: toBoundaryNumber(snapshot.totalEquity),
            eps: toBoundaryNumber(snapshot.eps),
            sharesOutstanding: toBoundaryNumber(snapshot.sharesOutstanding),
            marketPrice: toBoundaryNumber(snapshot.closePrice),
            marketUnitMetadata: controlledScenario?.persistedValuationInputs.marketUnitMetadata,
            marketCap: controlledScenario?.persistedValuationInputs.marketCap,
            units: {
              equity: "vnd",
              eps: "vnd_per_share",
              marketCap: "vnd",
              marketPrice: "vnd_per_share",
              netIncome: "vnd",
              revenue: "vnd",
              sharesOutstanding: "shares",
            },
            dataMode:
              bridgeState.status === "ready" || bridgeState.status === "insufficient"
                ? bridgeState.result.metadata.dataMode
                : null,
            productionApproved: false,
            sourceLabel: controlledScenario?.persistedValuationInputs.sourceLabel ?? snapshot.sourceName,
          }
        : null,
      mode: controlledScenario
        ? "mixed_source"
        : runtimeConsumption.valuationSourceMode === "sample_fallback"
          ? "fallback"
          : undefined,
    });
  })();

  const valuationDataQuality = useMemo(() => {
    if (bridgeState.status !== "ready" && bridgeState.status !== "insufficient") return null;
    const marketCapReady = controlledCalculationBoundary.calculation.metrics.marketCap.status === "ready";
    const hasReviewedFinancials =
      bridgeState.result.snapshot.sourceName?.includes("manual_reviewed_financial_statement") ||
      effectiveFinancialsRuntimeData?.source.dataMode === "research_only";
    const hiddenWhenDerived = new Set(["adjustedClosePrice", ...(marketCapReady ? ["marketCap"] : [])]);
    return {
      ...bridgeState.result.dataQuality,
      isDemoData: hasReviewedFinancials ? false : bridgeState.result.dataQuality.isDemoData,
      isResearchOnly: hasReviewedFinancials || bridgeState.result.dataQuality.isResearchOnly,
      missingFields: bridgeState.result.dataQuality.missingFields?.filter((field) => !hiddenWhenDerived.has(field)) ?? [],
      source: userFacingSource(bridgeState.result.dataQuality.source),
    };
  }, [bridgeState, controlledCalculationBoundary.calculation.metrics.marketCap.status, effectiveFinancialsRuntimeData]);

  const submitTicker = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (controlledScenarioBridgeState && controlledScenario) {
      setTickerInput(controlledScenario.ticker);
      setBridgeState(controlledScenarioBridgeState);
      return;
    }

    const nextTicker = tickerInput.trim().toUpperCase();
    if (!nextTicker) return;
    const url = new URL(window.location.href);
    url.searchParams.set("ticker", nextTicker);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
    setBridgeState({ status: "loading", ticker: nextTicker });
    setRequest((current) => ({ ticker: nextTicker, id: current.id + 1 }));
  };

  if (tickerFromUrl && !tickerMatches(tickerFromUrl, bridgeTicker)) {
    return (
      <div className="mx-auto w-full max-w-[1080px] space-y-5">
        <LoadingState
          description={`Đang chuyển sang dữ liệu định giá của ${tickerFromUrl}; dữ liệu ticker khác không được hiển thị thay thế.`}
          title="Đang kiểm tra đúng mã doanh nghiệp"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5">
      <Card>
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" onSubmit={submitTicker}>
            <div>
              <p className="text-xs font-bold uppercase text-muted">Nguồn dữ liệu định giá</p>
              <label className="mt-2 block text-sm font-extrabold text-ink" htmlFor="valuation-ticker-input">
                Mã doanh nghiệp
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="valuation-ticker-input"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
              />
            </div>
            <Button isLoading={bridgeState.status === "loading"} type="submit" variant="secondary">
              Kiểm tra dữ liệu
            </Button>
          </form>
        </CardBody>
      </Card>

      {bridgeState.status === "loading" ? (
        <LoadingState
          description={`Đang kiểm tra dữ liệu định giá đã có cho ${activeTicker}.`}
          title="Đang tải dữ liệu định giá"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Thiếu ${bridgeState.missingReasons.join(", ")} cho ${bridgeState.ticker}. Hệ thống không dùng dữ liệu minh họa của mã khác để thay thế.`}
          icon="V"
          title="Chưa đủ dữ liệu"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Hệ thống không dùng dữ liệu minh họa của mã khác để thay thế.`}
          icon="!"
          title={`Chưa thể đọc dữ liệu định giá cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "ready" || bridgeState.status === "insufficient" ? (
        <>
          <ValuationSummaryHero data={bridgeState.data.summary} />
          <ValuationFinancialsRuntimeNote boundary={runtimeConsumption} dataQuality={valuationDataQuality} />
          {bridgeState.status === "insufficient" ? (
            <section className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
              Dữ liệu chưa đủ để tính đầy đủ chỉ số định giá: {bridgeState.result.missingReasons.join(", ")}.
              Các chỉ số phụ thuộc dữ liệu thiếu sẽ ở trạng thái Chưa đủ dữ liệu hoặc N/A.
            </section>
          ) : null}
          <ControlledValuationCalculationPanel boundary={controlledCalculationBoundary} />
          <ValuationAssumptionPanel data={bridgeState.data.assumptions} />
          <ValuationUncertaintyPanel data={bridgeState.data.uncertainties} onNavigate={onNavigate} />
          <ValuationMethodSelector data={bridgeState.data.methods} />
          <ValuationRangeTable data={bridgeState.data.ranges} />
          <ValuationScenarioSafety data={bridgeState.data.scenarios} />
          <ValuationTrapList data={bridgeState.data.traps} />
          <ValuationFinalConclusion data={bridgeState.data.finalConclusion} />
          <ValuationNextStepActions data={bridgeState.data.nextActions} onNavigate={onNavigate} />
        </>
      ) : null}
    </div>
  );
}
