"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
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
  | { status: "loading" }
  | { status: "ready"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "insufficient"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "empty"; ticker: string; missingReasons: string[] }
  | { status: "error"; ticker: string; message: string };

const readableBoundaryValue = (value: string): string => value.replace(/_/g, " ");

const readinessLabel: Record<string, string> = {
  blocked: "Đang chặn theo phạm vi an toàn",
  insufficient_data: "Chưa đủ dữ liệu",
  mixed_source: "Nguồn hỗn hợp, cần kiểm tra",
  not_applicable: "Không áp dụng với dữ liệu hiện tại",
  partial: "Một phần",
  ready: "Có thể tính",
  sample_fallback: "Dữ liệu minh họa",
  unavailable: "Chưa có dữ liệu",
};

const userStatus = (value: string): string => readinessLabel[value] ?? readableBoundaryValue(value);

const valuationSourceStatus = (boundary: ValuationFinancialsRuntimeConsumption): string => {
  if (boundary.valuationSourceMode === "sample_fallback") {
    return "Đang dùng dữ liệu minh họa; chưa có bản ghi đủ điều kiện cho ticker này.";
  }
  return "Có bản ghi đã rà soát hoặc dữ liệu local/research; vẫn cần giữ ranh giới nguồn và kỳ dữ liệu.";
};

const userFacingSource = (source: string | null | undefined): string => {
  if (!source) return "Chưa có nguồn dữ liệu";
  if (source.includes("manual_reviewed_financial_statement")) return "Bản ghi đã rà soát, dùng cho nghiên cứu";
  if (source.includes("vnstock")) return "Dữ liệu giá/khối lượng nghiên cứu";
  if (source.includes("sample")) return "Dữ liệu minh họa";
  return "Dữ liệu có metadata nguồn";
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

function ValuationFinancialsRuntimeNote({ boundary }: { boundary: ValuationFinancialsRuntimeConsumption }) {
  const readinessRows = [
    ["P/E", boundary.calculationReadiness.pe],
    ["P/B", boundary.calculationReadiness.pb],
    ["BVPS", boundary.calculationReadiness.bvps],
    ["ROE", boundary.calculationReadiness.roe],
    ["Vốn hóa", boundary.calculationReadiness.marketCap],
  ] as const;
  const sourceSummaryRows = [
    [
      "Trạng thái nguồn",
      valuationSourceStatus(boundary),
    ],
    [
      "Ranh giới sử dụng",
      boundary.canClaimValuationDbBacked
        ? "Đủ điều kiện runtime để đọc từ DB, vẫn cần kiểm tra nguồn trước khi diễn giải."
        : "Chưa claim đầy đủ theo DB vì nguồn, kỳ dữ liệu và phê duyệt vẫn được kiểm tra riêng.",
    ],
    [
      "Độ phủ đầu vào",
      boundary.unavailableFields.length
        ? `Còn thiếu hoặc chưa dùng được: ${boundary.unavailableFields.join(", ")}`
        : "Các trường chính trong Financials runtime đã có.",
    ],
    [
      "Trạng thái rà soát",
      boundary.productionApproved
        ? "Cần kiểm tra thêm theo quy trình nguồn."
        : "Dữ liệu phục vụ nghiên cứu, chưa phê duyệt sản xuất.",
    ],
  ] as const;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">Định giá có kiểm soát</Chip>
            <Chip variant="neutral">{userStatus(boundary.valuationSourceMode)}</Chip>
            <Chip variant="neutral">Dữ liệu nghiên cứu</Chip>
            <Chip variant="neutral">Chưa phê duyệt sản xuất</Chip>
          </div>
          <p className="mt-3 font-semibold">
            Valuation chỉ hiển thị trạng thái tính được/chưa đủ dữ liệu cho các chỉ số cơ bản.
          </p>
          <p className="mt-1">
            EPS, số cổ phiếu và giá thị trường phải hợp lệ thì chỉ số liên quan mới được tính; đây không phải kết luận đầu tư.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {sourceSummaryRows.map(([label, value]) => (
              <div className="rounded-[4px] border border-[#E8CC82] bg-white/55 px-3 py-2" key={label}>
                <p className="text-[11px] font-bold uppercase tracking-[0.02em]">{label}</p>
                <p className="mt-1 leading-5">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-1">
            Trường đã dùng: {boundary.consumedFields.length ? boundary.consumedFields.join(", ") : "chưa có"}.
          </p>
          <p className="mt-1">
            Trường còn thiếu: {boundary.unavailableFields.length ? boundary.unavailableFields.join(", ") : "không có trường chính đang thiếu"}.
          </p>
          {boundary.warnings.length > 0 ? (
            <p className="mt-2">
              Ghi chú: {boundary.warnings.slice(0, 4).map(readableBoundaryValue).join(" | ")}
            </p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {readinessRows.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
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
          }
        : null,
    [controlledScenario],
  );
  const effectiveFinancialsRuntimeData = controlledScenario?.financialsRuntimeData ?? initialFinancialsRuntimeData;
  const [tickerInput, setTickerInput] = useState(controlledScenario?.ticker ?? "FPTLAB");
  const [request, setRequest] = useState({ ticker: controlledScenario?.ticker ?? "FPTLAB", id: 0 });
  const [bridgeState, setBridgeState] = useState<ValuationBridgeState>(
    controlledScenarioBridgeState ?? { status: "loading" },
  );
  const activeTicker = request.ticker;

  useEffect(() => {
    if (controlledScenario) {
      return;
    }

    let isActive = true;

    fetchValuationInputsByTicker({ ticker: activeTicker })
      .then((result) => {
        if (!isActive) return;
        if (result.missingReasons.includes("financial_statement")) {
          setBridgeState({ status: "empty", ticker: activeTicker, missingReasons: result.missingReasons });
          return;
        }

        const data = buildBridgeData(result);
        setBridgeState({
          status: result.status === "ready" ? "ready" : "insufficient",
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
        setBridgeState({ status: "error", ticker: activeTicker, message });
      });

    return () => {
      isActive = false;
    };
  }, [activeTicker, controlledScenario, request.id]);

  const metadataChips = useMemo(() => {
    if (bridgeState.status !== "ready" && bridgeState.status !== "insufficient") return [];
    const { metadata } = bridgeState.result;
    return [
      `Nguồn: ${metadata.sourceType.includes("company_disclosure") ? "bản ghi đã rà soát" : "dữ liệu có metadata"}`,
      `Trạng thái: ${userStatus(metadata.readiness)}`,
      "Chưa phê duyệt sản xuất",
    ];
  }, [bridgeState]);

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

  const controlledCalculationBoundary = useMemo(() => {
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
            revenue: snapshot.revenue,
            netIncome: snapshot.netProfit,
            equity: snapshot.totalEquity,
            eps: snapshot.eps,
            sharesOutstanding: snapshot.sharesOutstanding,
            marketPrice: snapshot.closePrice,
            marketUnitMetadata: controlledScenario?.persistedValuationInputs.marketUnitMetadata,
            marketCap: controlledScenario?.persistedValuationInputs.marketCap,
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
  }, [bridgeState, controlledScenario, effectiveFinancialsRuntimeData, runtimeConsumption.valuationSourceMode]);

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
    setBridgeState({ status: "loading" });
    setRequest((current) => ({ ticker: nextTicker, id: current.id + 1 }));
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5">
      <Card>
        <CardBody>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" onSubmit={submitTicker}>
            <div>
              <p className="text-xs font-bold uppercase text-muted">Valuation API bridge</p>
              <label className="mt-2 block text-sm font-extrabold text-ink" htmlFor="valuation-ticker-input">
                Ticker local
              </label>
              <input
                className="mt-2 h-9 w-full rounded-[3px] border border-border bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-accent sm:w-[180px]"
                id="valuation-ticker-input"
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
          description={`Đang đọc dữ liệu định giá đã persist cho ${activeTicker}.`}
          title="Đang tải Valuation từ API"
        />
      ) : null}

      {bridgeState.status === "empty" ? (
        <EmptyState
          description={`Thiếu ${bridgeState.missingReasons.join(", ")} cho ${bridgeState.ticker}. Không dùng dữ liệu mock để thay thế.`}
          icon="V"
          title="Chưa có dữ liệu nền cho Valuation"
        />
      ) : null}

      {bridgeState.status === "error" ? (
        <EmptyState
          description={`${bridgeState.message} Không dùng dữ liệu mock để thay thế.`}
          icon="!"
          title={`Không tải được Valuation cho ${bridgeState.ticker}`}
        />
      ) : null}

      {bridgeState.status === "ready" || bridgeState.status === "insufficient" ? (
        <>
          {valuationDataQuality ? <DataQualityBanner {...valuationDataQuality} /> : null}
          <ValuationFinancialsRuntimeNote boundary={runtimeConsumption} />
          <ControlledValuationCalculationPanel boundary={controlledCalculationBoundary} />
          <div className="flex flex-wrap gap-2">
            {metadataChips.map((chip) => (
              <Chip key={chip} variant="neutral">
                {chip}
              </Chip>
            ))}
          </div>
          {bridgeState.status === "insufficient" ? (
            <section className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm font-bold leading-6 text-ink">
              Dữ liệu chưa đủ để tính đầy đủ chỉ số định giá: {bridgeState.result.missingReasons.join(", ")}.
              Các chỉ số phụ thuộc dữ liệu thiếu sẽ ở trạng thái chưa đủ dữ liệu hoặc không phù hợp để diễn giải.
            </section>
          ) : null}
          <ValuationSummaryHero data={bridgeState.data.summary} />
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
