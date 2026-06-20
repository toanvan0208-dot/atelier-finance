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
  onNavigate?: (moduleKey: string) => void;
};

type ValuationBridgeState =
  | { status: "loading" }
  | { status: "ready"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "insufficient"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "empty"; ticker: string; missingReasons: string[] }
  | { status: "error"; ticker: string; message: string };

const metadataLabel = (value: string): string => value.replace(/_/g, " ");

const boundaryValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "unavailable";
  return String(value);
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
  const fields = [
    ["valuationSourceMode", boundary.valuationSourceMode],
    ["runtimeStatus", boundary.runtimeStatus],
    ["readPath", boundary.readPath],
    ["sourceLabel", boundary.sourceLabel],
    ["dataMode", boundary.dataMode],
    ["fallbackUsed", boundary.fallbackUsed],
    ["productionApproved", boundary.productionApproved],
    ["canClaimRuntimeBacked", boundary.canClaimValuationDbBacked],
  ] as const;
  const readinessRows = [
    ["pe", boundary.calculationReadiness.pe],
    ["pb", boundary.calculationReadiness.pb],
    ["bvps", boundary.calculationReadiness.bvps],
    ["roe", boundary.calculationReadiness.roe],
    ["marketCap", boundary.calculationReadiness.marketCap],
  ] as const;

  return (
    <section className="rounded-[4px] border border-[#D6B15C] bg-[#FFF8E5] px-4 py-4 text-sm text-[#765416]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral">valuation runtime boundary</Chip>
            <Chip variant="neutral">{boundary.valuationSourceMode}</Chip>
            <Chip variant="neutral">productionApproved:false</Chip>
            <Chip variant="neutral">controlled partial</Chip>
          </div>
          <p className="mt-3 font-semibold">
            Valuation uses a mixed source state: persisted input bridge for calculations plus controlled Financials runtime metadata when available.
          </p>
          <p className="mt-1">
            Local Financials runtime data is research-only. Missing EPS, equity, market price, or shares keep dependent metrics unavailable or not_applicable.
          </p>
          <p className="mt-1">
            Consumed fields: {boundary.consumedFields.length ? boundary.consumedFields.join(", ") : "none"}.
          </p>
          <p className="mt-1">
            Unavailable fields: {boundary.unavailableFields.length ? boundary.unavailableFields.join(", ") : "none"}.
          </p>
          {boundary.warnings.length > 0 ? (
            <p className="mt-2">Boundary warnings: {boundary.warnings.slice(0, 4).join(" | ")}</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-3 text-xs lg:min-w-[360px]">
          <dl className="grid gap-2">
            {fields.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-2 border-t border-[#E8CC82] pt-3">
            {readinessRows.map(([label, value]) => (
              <div className="grid grid-cols-[170px_1fr] gap-3" key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="min-w-0 break-words text-right">{boundaryValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function ValuationPage({ initialFinancialsRuntimeData, onNavigate }: ValuationPageProps) {
  const [tickerInput, setTickerInput] = useState("FPTLAB");
  const [request, setRequest] = useState({ ticker: "FPTLAB", id: 0 });
  const [bridgeState, setBridgeState] = useState<ValuationBridgeState>({ status: "loading" });
  const activeTicker = request.ticker;

  useEffect(() => {
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
  }, [activeTicker, request.id]);

  const metadataChips = useMemo(() => {
    if (bridgeState.status !== "ready" && bridgeState.status !== "insufficient") return [];
    const { metadata } = bridgeState.result;
    return [
      `dataMode: ${metadataLabel(metadata.dataMode)}`,
      `sourceType: ${metadataLabel(metadata.sourceType)}`,
      `quality: ${metadataLabel(metadata.qualityStatus)}`,
      `readiness: ${metadataLabel(metadata.readiness)}`,
      `fallback: ${String(metadata.fallback)}`,
    ];
  }, [bridgeState]);

  const runtimeConsumption = useMemo(() => {
    const snapshot =
      bridgeState.status === "ready" || bridgeState.status === "insufficient"
        ? bridgeState.result.snapshot
        : null;

    return buildValuationFinancialsRuntimeConsumption({
      financialsRuntimeData: initialFinancialsRuntimeData,
      persistedBridgeInputs: {
        eps: snapshot?.eps ?? null,
        equity: snapshot?.totalEquity ?? null,
        bvps: snapshot?.bvps ?? null,
        marketPrice: snapshot?.closePrice ?? null,
        sharesOutstanding: snapshot?.sharesOutstanding ?? null,
      },
    });
  }, [bridgeState, initialFinancialsRuntimeData]);

  const controlledCalculationBoundary = useMemo(() => {
    const snapshot =
      bridgeState.status === "ready" || bridgeState.status === "insufficient"
        ? bridgeState.result.snapshot
        : null;
    const runtimeSnapshot = initialFinancialsRuntimeData?.statementSnapshot;

    return buildControlledValuationIntegrationBoundary({
      financialsRuntimeSnapshot: runtimeSnapshot
        ? {
            revenue: runtimeSnapshot.revenue,
            netProfit: runtimeSnapshot.netProfit,
            totalEquity: runtimeSnapshot.totalEquity,
            eps: runtimeSnapshot.eps,
            sharesOutstanding: runtimeSnapshot.sharesOutstanding,
            dataMode: initialFinancialsRuntimeData.source.dataMode,
            readPath: initialFinancialsRuntimeData.source.readPath,
            runtimeStatus: initialFinancialsRuntimeData.runtimeStatus,
            fallbackUsed: initialFinancialsRuntimeData.source.fallbackUsed,
            productionApproved: initialFinancialsRuntimeData.source.productionApproved,
            sourceLabel: initialFinancialsRuntimeData.source.sourceLabel,
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
            dataMode:
              bridgeState.status === "ready" || bridgeState.status === "insufficient"
                ? bridgeState.result.metadata.dataMode
                : null,
            productionApproved: false,
            sourceLabel: snapshot.sourceName,
          }
        : null,
      mode: runtimeConsumption.valuationSourceMode === "sample_fallback" ? "fallback" : undefined,
    });
  }, [bridgeState, initialFinancialsRuntimeData, runtimeConsumption.valuationSourceMode]);

  const submitTicker = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          <DataQualityBanner {...bridgeState.result.dataQuality} />
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
