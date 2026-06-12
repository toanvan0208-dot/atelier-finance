"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import { businessPageData } from "../data/business.data";
import type { BusinessPageData } from "../types";
import { BusinessAnalysisGroups } from "./BusinessAnalysisGroups";
import { BusinessConclusion } from "./BusinessConclusion";
import { BusinessDisclaimer } from "./BusinessDisclaimer";
import { BusinessHeader } from "./BusinessHeader";
import { BusinessMiniCheck } from "./BusinessMiniCheck";
import { BusinessNextActions } from "./BusinessNextActions";
import { BusinessQuickSummary } from "./BusinessQuickSummary";
import { BusinessUnderstandingDashboard } from "./BusinessUnderstandingDashboard";

type BusinessPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

const journeySteps = ["Lọc cổ phiếu", "Hiểu doanh nghiệp", "Báo cáo tài chính", "Định giá"];

function useTickerFromUrl() {
  return useSyncExternalStore(
    (callback) => {
      const timeoutId = window.setTimeout(callback, 0);
      window.addEventListener("popstate", callback);

      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("popstate", callback);
      };
    },
    () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      return params.get("ticker");
    },
    () => null
  );
}

function normalizeTicker(ticker: string | null) {
  const value = ticker?.trim().toUpperCase();
  return value ? value : null;
}

function hasValidBusinessData(data: BusinessPageData | null) {
  return Boolean(
    data &&
      data.header?.ticker &&
      data.header.companyName &&
      data.dashboard?.identity &&
      data.dashboard.moneyMachine.length > 0 &&
      data.dashboard.operatingMetrics.length > 0 &&
      data.groups.length > 0 &&
      data.conclusion.items.length > 0 &&
      data.quickSummary.items.length > 0
  );
}

function getBusinessDataForTicker(selectedTicker: string | null) {
  const sampleTicker = businessPageData.header.ticker.toUpperCase();

  if (!selectedTicker) {
    return {
      data: businessPageData,
      isUsingDemoData: true,
      hasUnsupportedTicker: false,
    };
  }

  if (selectedTicker === sampleTicker) {
    return {
      data: businessPageData,
      isUsingDemoData: false,
      hasUnsupportedTicker: false,
    };
  }

  return {
    data: null,
    isUsingDemoData: false,
    hasUnsupportedTicker: true,
  };
}

function DemoDataNotice() {
  return (
    <Card className="border-border-soft bg-accent-soft">
      <CardBody className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold leading-6 text-ink">
          Đang dùng dữ liệu mẫu MWG để minh họa luồng hiểu doanh nghiệp. Khi kết nối dữ liệu thật, nội dung sẽ thay đổi theo mã cổ phiếu được chọn.
        </p>
        <Chip size="sm" variant="accent">
          Demo MWG
        </Chip>
      </CardBody>
    </Card>
  );
}

function BusinessJourneyBreadcrumb() {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[4px] border border-border-soft bg-surface px-3 py-2">
      {journeySteps.map((label, index) => (
        <div key={label} className="flex items-center gap-1.5">
          <Chip size="sm" variant={index === 1 ? "accent" : index < 1 ? "success" : "neutral"}>
            {label}
          </Chip>
          {index < journeySteps.length - 1 ? <span className="text-xs font-bold text-subtle">→</span> : null}
        </div>
      ))}
    </div>
  );
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const tickerFromUrl = useTickerFromUrl();
  const selectedTicker = normalizeTicker(tickerFromUrl);
  const { data, hasUnsupportedTicker, isUsingDemoData } = useMemo(
    () => getBusinessDataForTicker(selectedTicker),
    [selectedTicker]
  );
  const [miniCheckAnswers, setMiniCheckAnswers] = useState<Record<number, number>>({});

  if (businessPageData.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <LoadingState
          title={businessPageData.loading.title}
          description={businessPageData.loading.description}
        />
      </div>
    );
  }

  const hasData = hasValidBusinessData(data);

  if (!hasData || !data) {
    const title = hasUnsupportedTicker
      ? `Chưa có dữ liệu mô hình kinh doanh cho mã ${selectedTicker}.`
      : businessPageData.emptyState.title;
    const description = hasUnsupportedTicker
      ? "Prototype hiện mới có dữ liệu mẫu MWG cho module Hiểu doanh nghiệp. Hãy quay lại Lọc cổ phiếu hoặc bỏ ticker trên URL để xem demo MWG."
      : businessPageData.emptyState.description;

    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
        <BusinessJourneyBreadcrumb />
        <EmptyState
          title={title}
          description={description}
          icon={businessPageData.emptyState.icon}
          action={
            <Button variant="secondary" onClick={() => onNavigate?.("screening")}>
              Quay lại Lọc cổ phiếu
            </Button>
          }
        />
      </div>
    );
  }

  const isMiniCheckComplete = data.miniCheck.questions.every((question, index) => {
    return miniCheckAnswers[index] === question.correctIndex;
  });
  const canGoToFinancials = true;

  function handleMiniCheckAnswer(questionIndex: number, optionIndex: number) {
    setMiniCheckAnswers((current) => ({
      ...current,
      [questionIndex]: optionIndex,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-4 px-4 py-5 lg:px-0">
      {isUsingDemoData ? <DemoDataNotice /> : null}
      <BusinessJourneyBreadcrumb />
      <BusinessHeader
        canGoToFinancials={canGoToFinancials}
        data={data.header}
        onNavigate={onNavigate}
      />
      <BusinessQuickSummary data={data.quickSummary} />
      <section id="business-dashboard">
        <BusinessUnderstandingDashboard
          canGoToFinancials={canGoToFinancials}
          data={data.dashboard}
          onNavigate={onNavigate}
        />
      </section>
      <BusinessAnalysisGroups groups={data.groups} />
      <BusinessConclusion
        canGoToFinancials={isMiniCheckComplete}
        data={data.conclusion}
        onNavigate={onNavigate}
      />
      <BusinessMiniCheck
        answers={miniCheckAnswers}
        data={data.miniCheck}
        isComplete={isMiniCheckComplete}
        onAnswer={handleMiniCheckAnswer}
      />
      <BusinessNextActions
        canGoToFinancials={canGoToFinancials}
        data={data.nextActions}
        onNavigate={onNavigate}
      />
      <BusinessDisclaimer data={data.disclaimer} />
    </div>
  );
}
