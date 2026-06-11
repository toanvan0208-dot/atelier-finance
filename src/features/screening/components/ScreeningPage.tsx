"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, LoadingState } from "@/components/ui";
import { screeningPageData } from "../data/screening.data";
import type { ScreeningMode, ScreeningOption } from "../types";
import { ScreeningComparisonTable } from "./ScreeningComparisonTable";
import { ScreeningContextSummary } from "./ScreeningContextSummary";
import { ScreeningDeepDive } from "./ScreeningDeepDive";
import { ScreeningDisclaimer } from "./ScreeningDisclaimer";
import { ScreeningFunnelSummary } from "./ScreeningFunnelSummary";
import { ScreeningInputPanel } from "./ScreeningInputPanel";
import { ScreeningModeSelector } from "./ScreeningModeSelector";
import { ScreeningNextActions } from "./ScreeningNextActions";
import { ScreeningResultGroups } from "./ScreeningResultGroups";
import { TickerQuickCheck } from "./TickerQuickCheck";
import { UnderstandingCheck } from "./UnderstandingCheck";

function ScreeningHeader() {
  const data = screeningPageData.hero;

  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
            <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
              {data.icon}
            </span>
            <span>{data.eyebrow}</span>
          </div>
          <h1 className="font-brand text-2xl font-bold leading-tight text-ink">
            {data.title}
          </h1>
          <p className="mt-2 max-w-[68ch] text-sm leading-7 text-muted">
            {data.description}
          </p>
        </div>
        <span className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-bold text-ink">
          {data.statusLabel}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
          <span>{data.progressLabel}</span>
          <span>{data.progressValue}%</span>
        </div>
        <div className="h-2 rounded-[3px] border border-border-soft bg-surface-soft">
          <div
            className="h-full rounded-[2px] bg-accent"
            style={{ width: `${data.progressValue}%` }}
          />
        </div>
      </div>

      <p className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
        {data.warningNote}
      </p>
    </section>
  );
}

function sectorToIndustryKey(sector?: string) {
  if (sector === "Bán lẻ") return "retail";
  if (sector === "Ngân hàng") return "banking";
  if (sector === "Chứng khoán") return "securities";
  if (sector === "Thép") return "steel";
  if (sector === "Công nghệ") return "technology";
  if (sector === "Bất động sản") return "real-estate";
  return "retail";
}

export function ScreeningPage() {
  const data = screeningPageData;
  const [screeningMode, setScreeningMode] = useState<ScreeningMode>("context");
  const [activeIndustry, setActiveIndustry] = useState(data.input.defaultIndustry);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showAnalysisLayer, setShowAnalysisLayer] = useState(false);
  const deepDiveRef = useRef<HTMLElement | null>(null);

  const selectedStock = selectedTicker ? data.stocksByTicker[selectedTicker] : null;
  const shouldShowTickerDependentSections =
    screeningMode === "context" || Boolean(selectedStock);
  const contextIndustry =
    screeningMode === "ticker"
      ? sectorToIndustryKey(selectedStock?.sector)
      : activeIndustry;
  const nextActionStocks = useMemo<ScreeningOption[]>(
    () =>
      data.resultGroups
        .flatMap((group) => group.stocks)
        .filter((stock) => stock.groupKey !== "excluded")
        .map((stock) => ({ value: stock.ticker, label: stock.ticker })),
    [data.resultGroups]
  );

  if (data.isLoading) {
    return (
      <LoadingState
        description={data.loading.description}
        title={data.loading.title}
      />
    );
  }

  function handleModeChange(mode: ScreeningMode) {
    setScreeningMode(mode);
    if (mode === "context") {
      setSelectedTicker(null);
    }
  }

  function scrollToDeepDive() {
    deepDiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-8">
      <ScreeningHeader />

      <ScreeningModeSelector
        mode={screeningMode}
        options={data.modeOptions}
        onChange={handleModeChange}
      />

      {screeningMode === "context" ? (
        <ScreeningInputPanel
          data={data.input}
          resultGroups={data.resultGroups}
          onIndustryChange={setActiveIndustry}
        />
      ) : (
        <TickerQuickCheck
          data={data.tickerInput}
          labels={data.stockCardLabels}
          selectedTicker={selectedTicker}
          stocksByTicker={data.stocksByTicker}
          onOpenFunnel={scrollToDeepDive}
          onSelectTicker={setSelectedTicker}
        />
      )}

      <ScreeningFunnelSummary data={data.funnelSummary} mode={screeningMode} />

      {screeningMode === "context" ? (
        <ScreeningResultGroups
          emptyState={data.emptyState}
          groups={data.resultGroups}
          labels={data.resultGroupLabels}
          stockCardLabels={data.stockCardLabels}
        />
      ) : null}

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Lớp phân tích tùy chọn</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Mở khi cần xem luận điểm bối cảnh, so sánh nhanh, cách hệ thống lọc và quiz hiểu đúng.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowAnalysisLayer((value) => !value)}>
            {showAnalysisLayer ? "Ẩn phân tích phụ" : "Mở phân tích phụ"}
          </Button>
        </CardBody>
      </Card>

      {showAnalysisLayer ? (
        <div className="space-y-5">
          {shouldShowTickerDependentSections ? (
            <ScreeningContextSummary
              activeIndustry={contextIndustry}
              data={data.context}
              ticker={selectedTicker}
              tickerSector={selectedStock?.sector}
            />
          ) : null}

          {shouldShowTickerDependentSections ? (
            <ScreeningComparisonTable
              data={data.comparison}
              mode={screeningMode}
              selectedStock={selectedStock}
              stocksByTicker={data.stocksByTicker}
            />
          ) : (
            <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
              Chọn hoặc nhập một mã hợp lệ để mở so sánh nhanh.
            </p>
          )}

          <section ref={deepDiveRef}>
            <ScreeningDeepDive data={data.deepDive} />
          </section>

          <UnderstandingCheck data={data.understanding} />
        </div>
      ) : null}

      <ScreeningNextActions
        data={data.nextActions}
        mode={screeningMode}
        selectedTicker={selectedTicker}
        stocks={nextActionStocks}
      />

      <ScreeningDisclaimer data={data.disclaimer} />
    </div>
  );
}
