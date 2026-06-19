"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DataQualityBanner } from "@/components/shared/DataQualityBanner";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  fetchValuationInputsByTicker,
  ValuationApiError,
  type ValuationApiInputs,
} from "@/lib/data-sources/valuation-api-client";
import { baseValuationRefactoredData } from "../data/valuationRefactored.data";
import { buildValuationDeskData } from "../lib/build-valuation-desk-data";
import type { ValuationRefactoredData } from "../types";
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
  onNavigate?: (moduleKey: string) => void;
};

type ValuationBridgeState =
  | { status: "loading" }
  | { status: "ready"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "insufficient"; result: ValuationApiInputs; data: ValuationRefactoredData }
  | { status: "empty"; ticker: string; missingReasons: string[] }
  | { status: "error"; ticker: string; message: string };

const metadataLabel = (value: string): string => value.replace(/_/g, " ");

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

export function ValuationPage({ onNavigate }: ValuationPageProps) {
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
