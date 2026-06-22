"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import {
  businessJourneyByTicker,
  defaultBusinessJourneyTicker,
} from "../data/businessJourney.data";
import {
  findBusinessCompanyProfile,
  formatBusinessProfileField,
  normalizeBusinessTicker,
} from "../lib/business-company-selection";
import type { BusinessCompanyProfile, BusinessDeepDiveData, BusinessJourneyData } from "../types";
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

function getBusinessJourneyData(selectedTicker: string | null) {
  if (!selectedTicker) {
    return {
      data: businessJourneyByTicker[defaultBusinessJourneyTicker],
      profile: findBusinessCompanyProfile(defaultBusinessJourneyTicker),
      isUsingSampleData: true,
      hasUnsupportedTicker: false,
    };
  }

  const profile = findBusinessCompanyProfile(selectedTicker);

  return {
    data: businessJourneyByTicker[selectedTicker] ?? null,
    profile,
    isUsingSampleData: false,
    hasUnsupportedTicker: !profile,
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
          Đang dùng dữ liệu minh họa MWG khi URL chưa có ticker. Nội dung này không được hiểu là hồ sơ doanh nghiệp đã xác minh.
        </p>
        <Chip size="sm" variant="accent">
          Dữ liệu minh họa
        </Chip>
      </CardBody>
    </Card>
  );
}

function CompanyDataStatus({ profile }: { profile: BusinessCompanyProfile }) {
  const statusLabel = profile.dataStatus === "missing" ? "Chưa đủ dữ liệu" : "Dữ liệu đang được rà soát";

  return (
    <Card className="border-border-soft bg-surface">
      <CardBody className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">{profile.ticker}</Chip>
          <Chip variant="neutral">{formatBusinessProfileField(profile.exchange)}</Chip>
          <Chip variant="warning">{statusLabel}</Chip>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Doanh nghiệp</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-ink">{profile.companyName}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
            <p className="mt-1 text-sm leading-5 text-muted">{formatBusinessProfileField(profile.industry)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Nguồn / trạng thái</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {profile.sourceLabel ?? "Nguồn dữ liệu đang hoàn thiện"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Kỳ / asOf</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {profile.period && profile.asOf ? `${profile.period} · ${profile.asOf}` : "Chưa đủ dữ liệu"}
            </p>
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
          <p className="text-[11px] font-bold uppercase text-subtle">Mô tả hoạt động</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            {formatBusinessProfileField(profile.businessDescription)}
          </p>
        </div>

        <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
          {profile.warnings[0]}
        </p>
        <p className="text-xs leading-5 text-muted">
          Phần này giúp người dùng hiểu doanh nghiệp đang làm gì và dữ liệu nào đã có. Đây không phải khuyến nghị đầu tư.
        </p>
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
  const selectedTicker = normalizeBusinessTicker(tickerFromUrl);
  const { data, profile, hasUnsupportedTicker, isUsingSampleData } = useMemo(
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
      : profile
        ? `Đã nhận đúng mã ${profile.ticker}; nội dung mô hình chi tiết đang được rà soát.`
        : emptyState.title;
    const description = profile
      ? "Chưa đủ dữ liệu đã xác minh để hiển thị các phần mô hình kinh doanh. Hệ thống không dùng nội dung mẫu của mã khác để thay thế."
      : emptyState.description;

    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
        <JourneyProgress />
        {profile ? <CompanyDataStatus profile={profile} /> : null}
        <EmptyState
          title={title}
          description={description}
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
      {profile ? <CompanyDataStatus profile={profile} /> : null}
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
