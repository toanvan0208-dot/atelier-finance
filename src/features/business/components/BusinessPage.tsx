"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  businessJourneyByTicker,
  defaultBusinessJourneyTicker,
} from "../data/businessJourney.data";
import type { BusinessDeepDiveData, BusinessJourneyData } from "../types";
import { AdvantageRealityCheck } from "./AdvantageRealityCheck";
import { BridgeToFinancialStatements } from "./BridgeToFinancialStatements";
import { BusinessIdentityCard } from "./BusinessIdentityCard";
import { CustomerReasonSection } from "./CustomerReasonSection";
import { DeepDiveDrawer } from "./DeepDiveDrawer";
import { MoneyMachineFlow } from "./MoneyMachineFlow";
import { NonFinancialRiskMap } from "./NonFinancialRiskMap";
import { StrategyLeadershipSection } from "./StrategyLeadershipSection";

type BusinessPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

const journeySteps = [
  "Hiểu công ty",
  "Hiểu khách hàng",
  "Hiểu cỗ máy kiếm tiền",
  "Kiểm tra lợi thế",
  "Nhìn chiến lược",
  "Nhận diện rủi ro",
  "Sang BCTC kiểm chứng",
];

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

function getBusinessJourneyData(selectedTicker: string | null) {
  if (!selectedTicker) {
    return {
      data: businessJourneyByTicker[defaultBusinessJourneyTicker],
      isUsingSampleData: true,
      hasUnsupportedTicker: false,
    };
  }

  return {
    data: businessJourneyByTicker[selectedTicker] ?? null,
    isUsingSampleData: false,
    hasUnsupportedTicker: !businessJourneyByTicker[selectedTicker],
  };
}

function hasValidBusinessJourneyData(data: BusinessJourneyData | null) {
  return Boolean(
    data &&
      data.businessIdentity?.ticker &&
      data.businessIdentity.companyName &&
      data.businessIdentity.simpleDescription &&
      data.customers.mainCustomers.length > 0 &&
      data.moneyMachine.inputs.length > 0 &&
      data.competitiveAdvantage.advantages.length > 0 &&
      data.strategyAndLeadership.strategicDirection.length > 0 &&
      data.nonFinancialRisks.risks.length > 0 &&
      data.bridgeToFinancialStatements.financialMetricsToCheck.length > 0
  );
}

function SampleDataNotice() {
  return (
    <Card className="border-border-soft bg-accent-soft">
      <CardBody className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold leading-6 text-ink">
          Đang dùng dữ liệu mẫu MWG để minh họa luồng hiểu doanh nghiệp. Khi kết nối dữ liệu thật, nội dung sẽ thay đổi theo mã cổ phiếu được chọn.
        </p>
        <Chip size="sm" variant="accent">
          Dữ liệu mẫu MWG
        </Chip>
      </CardBody>
    </Card>
  );
}

function JourneyProgress() {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="flex min-w-max items-center gap-2">
        {journeySteps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <Chip size="sm" variant={index === 0 ? "accent" : "neutral"}>
              {index + 1}. {step}
            </Chip>
            {index < journeySteps.length - 1 ? <span className="text-xs font-bold text-subtle">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageIntro() {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <p className="max-w-[82ch] text-sm leading-6 text-muted">
        Module này không phân tích sâu số liệu tài chính. Mục tiêu là hiểu công ty như một cỗ máy kinh doanh ngoài đời: ai trả tiền, vì sao họ mua, mô hình vận hành ra sao, lợi thế có thật không và rủi ro nào cần quan sát trước khi sang Báo cáo tài chính.
      </p>
    </div>
  );
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const tickerFromUrl = useTickerFromUrl();
  const selectedTicker = normalizeTicker(tickerFromUrl);
  const { data, hasUnsupportedTicker, isUsingSampleData } = useMemo(
    () => getBusinessJourneyData(selectedTicker),
    [selectedTicker]
  );
  const [deepDive, setDeepDive] = useState<BusinessDeepDiveData | null>(null);

  if (data?.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <LoadingState title={data.loading.title} description={data.loading.description} />
      </div>
    );
  }

  if (!hasValidBusinessJourneyData(data) || !data) {
    const emptyState = businessJourneyByTicker[defaultBusinessJourneyTicker].emptyState;
    const title = hasUnsupportedTicker
      ? `Chưa có dữ liệu mô hình kinh doanh cho mã ${selectedTicker}.`
      : emptyState.title;

    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
        <JourneyProgress />
        <EmptyState
          title={title}
          description={emptyState.description}
          icon={emptyState.icon}
          action={
            <Button variant="secondary" onClick={() => onNavigate?.("screening")}>
              Quay lại Lọc cổ phiếu
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-4 px-4 py-5 lg:px-0">
      {isUsingSampleData ? <SampleDataNotice /> : null}
      <JourneyProgress />
      <PageIntro />

      <main className="min-w-0 space-y-4">
        <BusinessIdentityCard
          data={data.businessIdentity}
          isSample={isUsingSampleData}
          onDeepDive={() => setDeepDive(data.businessIdentity.deepDive)}
        />
        <CustomerReasonSection
          data={data.customers}
          onDeepDive={() => setDeepDive(data.customers.deepDive)}
        />
        <MoneyMachineFlow
          data={data.moneyMachine}
          onDeepDive={() => setDeepDive(data.moneyMachine.deepDive)}
        />
        <AdvantageRealityCheck
          data={data.competitiveAdvantage}
          onDeepDive={() => setDeepDive(data.competitiveAdvantage.deepDive)}
        />
        <StrategyLeadershipSection
          data={data.strategyAndLeadership}
          onDeepDive={() => setDeepDive(data.strategyAndLeadership.deepDive)}
        />
        <NonFinancialRiskMap
          data={data.nonFinancialRisks}
          onDeepDive={() => setDeepDive(data.nonFinancialRisks.deepDive)}
        />
        <BridgeToFinancialStatements
          data={data.bridgeToFinancialStatements}
          onNavigate={onNavigate}
        />
      </main>

      <DeepDiveDrawer data={deepDive} onClose={() => setDeepDive(null)} />
    </div>
  );
}
