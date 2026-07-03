"use client";

import { useEffect, useMemo, useState } from "react";
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

type RuntimeBusinessProfile = {
  ticker: string;
  companyName: string;
  exchange: string | null;
  industryCode: string | null;
  industryName: string | null;
  businessProfile?: {
    businessDescription: string | null;
    mainProducts: string | null;
    businessRiskNotes: string | null;
    sourceLabel: string;
    dataMode: string;
    productionApproved: boolean;
    needsReview: boolean;
    profileLanguage: string;
  };
};

const navigationChangeEvent = "app:navigation";

const journeySteps = [
  "Hiểu công ty",
  "Hiểu khách hàng",
  "Hiểu cỗ máy kiếm tiền",
  "Kiểm tra lợi thế",
  "Nhìn chiến lược",
  "Nhận diện rủi ro",
  "Sang BCTC kiểm chứng",
];

function readTickerFromLocation() {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get("ticker");
}

function useTickerFromUrl() {
  const [ticker, setTicker] = useState<string | null>(() => readTickerFromLocation());

  useEffect(() => {
    const updateTicker = () => setTicker(readTickerFromLocation());

    updateTicker();
    window.addEventListener("popstate", updateTicker);
    window.addEventListener(navigationChangeEvent, updateTicker);

    return () => {
      window.removeEventListener("popstate", updateTicker);
      window.removeEventListener(navigationChangeEvent, updateTicker);
    };
  }, []);

  return ticker;
}

function useRuntimeBusinessProfile(selectedTicker: string | null) {
  const [profile, setProfile] = useState<RuntimeBusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!selectedTicker) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setProfile(null);
          setIsLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(() => {
      if (!cancelled) setIsLoading(true);
    });
    fetch(`/api/companies/${encodeURIComponent(selectedTicker)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { data?: RuntimeBusinessProfile };
        return payload.data?.businessProfile ? payload.data : null;
      })
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  return { profile, isLoading };
}

export function resolveBusinessJourneyData(selectedTicker: string | null) {
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
    data: profile ? businessJourneyByTicker[selectedTicker] ?? null : null,
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

function RuntimeBusinessProfileView({
  profile,
  onNavigate,
}: {
  profile: RuntimeBusinessProfile;
  onNavigate?: (moduleKey: string) => void;
}) {
  const businessProfile = profile.businessProfile;

  if (!businessProfile) return null;

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-4 px-4 py-5 lg:px-0">
      <JourneyProgress />

      <Card className="border-border-soft bg-surface">
        <CardBody className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="accent">{profile.ticker}</Chip>
              <Chip variant="neutral">{profile.exchange ?? "N/A"}</Chip>
              <Chip variant="warning">research_only</Chip>
              <Chip variant="warning">needsReview</Chip>
            </div>
            <Button variant="secondary" onClick={() => onNavigate?.("financials")}>
              Sang Báo cáo tài chính
            </Button>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Hiểu doanh nghiệp</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">{profile.companyName}</h1>
            <p className="mt-2 max-w-[82ch] text-sm leading-6 text-muted">
              Dữ liệu bên dưới lấy từ CompanyBusinessProfile đã lưu trong hệ thống cho {profile.ticker}. Đây là dữ liệu nghiên cứu cần rà soát, không phải khuyến nghị đầu tư.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border-soft bg-surface">
          <CardBody className="space-y-3 px-4 py-4">
            <h2 className="text-lg font-bold text-ink">Mô hình kinh doanh</h2>
            <p className="text-sm leading-6 text-muted">
              {businessProfile.businessDescription || "Chưa đủ dữ liệu"}
            </p>
          </CardBody>
        </Card>

        <Card className="border-border-soft bg-surface">
          <CardBody className="space-y-3 px-4 py-4">
            <h2 className="text-lg font-bold text-ink">Nguồn và giới hạn</h2>
            <div className="space-y-2 text-sm leading-6 text-muted">
              <p>Nguồn: {businessProfile.sourceLabel}</p>
              <p>dataMode: {businessProfile.dataMode}</p>
              <p>needsReview: {String(businessProfile.needsReview)}</p>
              <p>productionApproved: {String(businessProfile.productionApproved)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border-soft bg-surface">
          <CardBody className="space-y-3 px-4 py-4">
            <h2 className="text-lg font-bold text-ink">Sản phẩm / dịch vụ chính</h2>
            <p className="text-sm leading-6 text-muted">
              {businessProfile.mainProducts || "Chưa đủ dữ liệu"}
            </p>
          </CardBody>
        </Card>

        <Card className="border-border-soft bg-surface">
          <CardBody className="space-y-3 px-4 py-4">
            <h2 className="text-lg font-bold text-ink">Điểm cần kiểm tra tiếp</h2>
            <p className="text-sm leading-6 text-muted">
              {businessProfile.businessRiskNotes || "Chưa đủ dữ liệu"}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="border-warning bg-warning/15">
        <CardBody className="px-4 py-3">
          <p className="text-sm font-semibold leading-6 text-ink">
            Phần này chỉ giúp hiểu mô hình kinh doanh và mức độ sẵn sàng dữ liệu. Không dùng làm benchmark định giá/rủi ro, không phải phân tích đầy đủ và không phải khuyến nghị đầu tư.
          </p>
        </CardBody>
      </Card>
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
  const { profile: runtimeProfile, isLoading: isRuntimeProfileLoading } = useRuntimeBusinessProfile(selectedTicker);
  const { data, profile, hasUnsupportedTicker, isUsingSampleData } = useMemo(
    () => resolveBusinessJourneyData(selectedTicker),
    [selectedTicker]
  );
  const [deepDive, setDeepDive] = useState<BusinessDeepDiveData | null>(null);

  if (isRuntimeProfileLoading && selectedTicker) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <LoadingState
          title="Đang kiểm tra hồ sơ doanh nghiệp"
          description="Hệ thống đang đọc CompanyBusinessProfile cho mã đã chọn."
        />
      </div>
    );
  }

  if (runtimeProfile) {
    return <RuntimeBusinessProfileView profile={runtimeProfile} onNavigate={onNavigate} />;
  }

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
        ? `Chưa đủ dữ liệu mô tả doanh nghiệp cho ${profile.ticker}.`
        : emptyState.title;
    const description = profile
      ? "Cần bổ sung dữ liệu doanh nghiệp đã rà soát trước khi kết luận. Hệ thống không dùng nội dung mẫu của mã khác để thay thế."
      : "Chưa có hồ sơ doanh nghiệp đã rà soát cho mã này trong hệ thống. Hệ thống không dùng dữ liệu mẫu của mã khác để thay thế.";

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
