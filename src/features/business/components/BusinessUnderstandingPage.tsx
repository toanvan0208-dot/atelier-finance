"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Button, Card, CardBody, Chip, EmptyState } from "@/components/ui";
import {
  buildBusinessUnderstandingInterpretation,
  getBusinessSectionMeaning,
} from "../data/businessUnderstandingInterpretation";
import {
  findBusinessUnderstandingProfile,
  type BusinessFlowNode,
  type BusinessUnderstandingProfile,
} from "../data/businessUnderstandingByTicker";

type BusinessUnderstandingPageProps = {
  onNavigate: (moduleKey: string) => void;
};

type JourneyStepState = "done" | "current" | "upcoming";

type JourneyStep = {
  number: string;
  label: string;
  state: JourneyStepState;
  ctaLabel: string;
  onCta: () => void;
};

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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

function getStepVariant(state: JourneyStepState) {
  if (state === "done") return "success" as const;
  if (state === "current") return "accent" as const;
  return "neutral" as const;
}

function SectionShell({
  title,
  subtitle,
  meaning,
  misread,
  ctaLabel,
  onCta,
  children,
}: {
  title: string;
  subtitle?: string;
  meaning: string;
  misread: string;
  ctaLabel: string;
  onCta: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="border-border-soft bg-surface">
      <CardBody className="space-y-3 px-4 py-3 md:px-4 md:py-3">
        <div className="space-y-1">
          <h2 className="text-[15px] font-bold leading-6 text-ink md:text-base">{title}</h2>
          {subtitle ? <p className="text-sm leading-5 text-muted">{subtitle}</p> : null}
        </div>

        {children}

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
              Ý nghĩa phân tích
            </p>
            <p className="mt-1 text-sm leading-5 text-ink">{meaning}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
              Hiểu sai thường gặp
            </p>
            <p className="mt-1 text-sm leading-5 text-ink">{misread}</p>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border-soft pt-2">
          <Button size="sm" variant="secondary" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function CompactList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="space-y-1 text-sm leading-5 text-ink">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CompactTagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Chip key={item} size="sm" variant="neutral">
          {item}
        </Chip>
      ))}
    </div>
  );
}

function BusinessProfileHeader({
  interpretation,
  profile,
  onNavigate,
}: {
  interpretation: ReturnType<typeof buildBusinessUnderstandingInterpretation>;
  profile: BusinessUnderstandingProfile;
  onNavigate: (moduleKey: string) => void;
}) {
  return (
    <Card className="border-border-soft">
      <CardBody className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {["Lọc cổ phiếu", "Hiểu doanh nghiệp", "Báo cáo tài chính", "Định giá"].map((label, index) => (
            <div key={label} className="flex items-center gap-1.5">
              <Chip
                size="sm"
                variant={index === 1 ? "accent" : index === 0 ? "success" : "neutral"}
              >
                {label}
              </Chip>
              {index < 3 ? <span className="text-xs font-bold text-subtle">→</span> : null}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip size="sm" variant="accent">
                Bước 2/4
              </Chip>
              <Chip size="sm" variant="neutral">
                {profile.ticker}
              </Chip>
              <Chip size="sm" variant="neutral">
                {profile.companyName}
              </Chip>
              <Chip size="sm" variant="neutral">
                {profile.industry}
              </Chip>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px]">
              {interpretation.headline}
            </h1>
            <p className="max-w-[78ch] text-sm leading-5 text-muted">{interpretation.lead}</p>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Ngành cần chú ý
                </p>
                <p className="mt-1 text-sm leading-5 text-ink">{interpretation.ruleSummary}</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft/70 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Ý nghĩa chính
                </p>
                <p className="mt-1 text-sm leading-5 text-ink">{interpretation.keyTakeaway}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onNavigate("screening")}>
              Quay lại Lọc cổ phiếu
            </Button>
            <Button size="sm" variant="primary" onClick={() => onNavigate("financials")}>
              Sang BCTC kiểm chứng
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function BusinessJourneyStepper({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-1.5">
            <Chip size="sm" variant={getStepVariant(step.state)}>
              {step.number}
            </Chip>
            <span className="text-xs font-semibold text-ink">{step.label}</span>
            {index < steps.length - 1 ? <span className="text-xs font-bold text-subtle">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepRail({ number, state }: { number: string; state: JourneyStepState }) {
  return (
    <div className="relative flex w-5 shrink-0 justify-center">
      <div
        className={[
          "mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
          state === "current"
            ? "border-border bg-accent text-ink"
            : state === "done"
              ? "border-accent-green bg-accent-green/10 text-accent-green"
              : "border-border-soft bg-surface text-subtle",
        ].join(" ")}
      >
        {number}
      </div>
    </div>
  );
}

function StepSection({
  step,
  children,
}: {
  step: JourneyStep;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[20px_minmax(0,1fr)]">
      <StepRail number={step.number} state={step.state} />
      <div className="min-w-0">
        <Card className={step.state === "current" ? "border-border bg-surface shadow-hard-sm" : "border-border-soft"}>
          <CardBody className="space-y-3 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip size="sm" variant={getStepVariant(step.state)}>
                    {step.state === "done" ? "Đã đi qua" : step.state === "current" ? "Đang ở đây" : "Bước tiếp theo"}
                  </Chip>
                  <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
                    Bước {step.number}
                  </span>
                </div>
                <h2 className="mt-1 text-[15px] font-bold leading-6 text-ink md:text-base">
                  {step.label}
                </h2>
              </div>
            </div>

            {children}

            <div className="flex items-center justify-end border-t border-border-soft pt-2">
              <Button size="sm" variant={step.state === "current" ? "primary" : "secondary"} onClick={step.onCta}>
                {step.ctaLabel}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function BusinessCustomerProductSection({
  profile,
}: {
  profile: BusinessUnderstandingProfile;
}) {
  const section = profile.customerAndProduct;
  const meaning = getBusinessSectionMeaning(profile, "customerAndProduct");

  return (
    <SectionShell
      ctaLabel="Tiếp: Dòng tiền mô hình"
      meaning={meaning.analysisMeaning}
      misread={meaning.commonMisread}
      subtitle={section.title}
      title={`${profile.ticker} phục vụ ${section.customers.join(", ")} bằng ${section.products.join(", ")}.`}
      onCta={() => scrollToSection("business-step-2")}
    >
      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Bán gì</p>
          <div className="mt-1">
            <CompactList items={section.products} />
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Bán cho ai</p>
          <div className="mt-1">
            <CompactList items={section.customers} />
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Vì sao khách mua</p>
          <div className="mt-1">
            <CompactList items={section.purchaseReasons} />
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Động lực nhu cầu</p>
          <div className="mt-1">
            <CompactTagList items={section.demandDrivers} />
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Kết quả cần nhớ</p>
          <p className="mt-1 text-sm leading-5 text-ink">{profile.overview.keyTakeaway}</p>
        </div>
      </div>
    </SectionShell>
  );
}

function FlowArrow() {
  return <span className="text-xs font-bold text-subtle">→</span>;
}

function FlowNode({
  node,
  accent = false,
}: {
  node: BusinessFlowNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[3px] border px-3 py-2 text-center",
        accent ? "border-border bg-accent-soft text-ink" : "border-border-soft bg-surface text-ink",
      ].join(" ")}
    >
      <p className="text-sm font-bold leading-5">{node.label}</p>
      {node.description ? <p className="mt-0.5 text-[11px] leading-4 text-subtle">{node.description}</p> : null}
    </div>
  );
}

function BusinessMoneyFlowSection({
  profile,
}: {
  profile: BusinessUnderstandingProfile;
}) {
  const section = profile.moneyFlow;
  const meaning = getBusinessSectionMeaning(profile, "moneyFlow");
  const source = section.flow.find((item) => item.type === "source");
  const operation = section.flow.find((item) => item.type === "operation");
  const channel = section.flow.find((item) => item.type === "channel");
  const customer = section.flow.find((item) => item.type === "customer");
  const revenue = section.flow.find((item) => item.type === "revenue");
  const cost = section.flow.find((item) => item.type === "cost");
  const profit = section.flow.find((item) => item.type === "profit");

  const mainChain = [source, operation, channel, customer, revenue].filter(Boolean) as BusinessFlowNode[];
  const resultChain = [revenue, cost, profit].filter(Boolean) as BusinessFlowNode[];

  return (
    <SectionShell
      ctaLabel="Tiếp: Hơn/kém đối thủ"
      meaning={meaning.analysisMeaning}
      misread={meaning.commonMisread}
      onCta={() => scrollToSection("business-step-3")}
      subtitle={section.title}
      title={`${profile.ticker} tạo doanh thu rồi biến nó thành lợi nhuận như thế nào?`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {mainChain.map((node, index) => (
            <div key={node.label} className="flex items-center gap-2">
              <FlowNode node={node} accent={index === 0 || index === mainChain.length - 1} />
              {index < mainChain.length - 1 ? <FlowArrow /> : null}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resultChain.map((node, index) => (
            <div key={node.label} className="flex items-center gap-2">
              <FlowNode node={node} accent={index === resultChain.length - 1} />
              {index < resultChain.length - 1 ? <FlowArrow /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Nguồn doanh thu chính</p>
          <div className="mt-1">
            <CompactTagList items={section.mainRevenueSources} />
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Khoản chi phí chính</p>
          <div className="mt-1">
            <CompactTagList items={section.mainCostItems} />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function BusinessCompetitivePositionSection({
  profile,
}: {
  profile: BusinessUnderstandingProfile;
}) {
  const section = profile.competitivePosition;
  const meaning = getBusinessSectionMeaning(profile, "competitivePosition");

  return (
    <SectionShell
      ctaLabel="Tiếp: Khi nào tốt/xấu"
      meaning={meaning.analysisMeaning}
      misread={meaning.commonMisread}
      onCta={() => scrollToSection("business-step-4")}
      subtitle={section.title}
      title={`${profile.ticker} mạnh hơn hoặc yếu hơn đối thủ ở đâu?`}
    >
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm mạnh</p>
          <div className="mt-2 space-y-2">
            {section.strengths.map((item) => (
              <div key={item.label} className="rounded-[3px] border border-border-soft bg-surface-soft/70 px-2.5 py-2">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm yếu</p>
          <div className="mt-2 space-y-2">
            {section.weaknesses.map((item) => (
              <div key={item.label} className="rounded-[3px] border border-border-soft bg-surface-soft/70 px-2.5 py-2">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hướng đi tương lai</p>
          <div className="mt-2 space-y-2">
            {section.futureDirection.map((item) => (
              <div key={item.label} className="rounded-[3px] border border-border-soft bg-surface-soft/70 px-2.5 py-2">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function BusinessConditionSection({
  profile,
}: {
  profile: BusinessUnderstandingProfile;
}) {
  const section = profile.businessConditions;
  const meaning = getBusinessSectionMeaning(profile, "businessConditions");

  return (
    <SectionShell
      ctaLabel="Tiếp: Sang BCTC"
      meaning={meaning.analysisMeaning}
      misread={meaning.commonMisread}
      onCta={() => scrollToSection("business-step-5")}
      subtitle={section.title}
      title={`Mô hình của ${profile.ticker} tốt lên hoặc xấu đi trong điều kiện nào?`}
    >
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình tốt lên khi</p>
          <div className="mt-1">
            <CompactList items={section.improvesWhen} />
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình xấu đi khi</p>
          <div className="mt-1">
            <CompactList items={section.worsensWhen} />
          </div>
        </div>
      </div>

      <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Các tín hiệu cần theo dõi</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {section.keySignalsToWatch.map((item) => (
            <Chip key={item} size="sm" variant="neutral">
              {item}
            </Chip>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function BusinessNextFinancialCheckSection({
  profile,
  onNavigate,
}: {
  profile: BusinessUnderstandingProfile;
  onNavigate: (moduleKey: string) => void;
}) {
  const section = profile.nextFinancialChecks;

  return (
    <SectionShell
      ctaLabel="Sang BCTC kiểm chứng"
      meaning={section.description}
      misread="Không dùng phần này để kết luận mua hoặc bán cổ phiếu."
      onCta={() => onNavigate("financials")}
      subtitle={section.title}
      title={`Sang Báo cáo tài chính để kiểm chứng ${profile.ticker}`}
    >
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {section.checks.map((item) => (
          <div key={item.label} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">{item.label}</p>
            <p className="mt-1 text-sm leading-5 text-ink">{item.reason}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function BusinessUnderstandingPage({ onNavigate }: BusinessUnderstandingPageProps) {
  const ticker = useTickerFromUrl();
  const profile = useMemo(() => findBusinessUnderstandingProfile(ticker), [ticker]);

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-[1120px] px-4 py-5 lg:px-0">
        <EmptyState
          title="Chưa có dữ liệu mô hình kinh doanh cho mã này."
          description="Chọn một mã cổ phiếu có dữ liệu để xem phần phân tích doanh nghiệp."
          action={
            <Button variant="secondary" onClick={() => onNavigate("screening")}>
              Quay lại Lọc cổ phiếu
            </Button>
          }
        />
      </div>
    );
  }

  const interpretation = buildBusinessUnderstandingInterpretation(profile);
  const steps: JourneyStep[] = [
    {
      number: "01",
      label: "Doanh nghiệp phục vụ ai và bán gì?",
      state: "done",
      ctaLabel: "Tiếp: Dòng tiền mô hình",
      onCta: () => scrollToSection("business-step-2"),
    },
    {
      number: "02",
      label: "Dòng tiền mô hình đi như thế nào?",
      state: "current",
      ctaLabel: "Tiếp: Hơn/kém đối thủ",
      onCta: () => scrollToSection("business-step-3"),
    },
    {
      number: "03",
      label: "Có gì hơn/kém đối thủ?",
      state: "upcoming",
      ctaLabel: "Tiếp: Khi nào tốt/xấu",
      onCta: () => scrollToSection("business-step-4"),
    },
    {
      number: "04",
      label: "Mô hình tốt/xấu khi nào?",
      state: "upcoming",
      ctaLabel: "Tiếp: Sang BCTC",
      onCta: () => scrollToSection("business-step-5"),
    },
    {
      number: "05",
      label: "Sang BCTC kiểm chứng",
      state: "upcoming",
      ctaLabel: "Sang BCTC kiểm chứng",
      onCta: () => onNavigate("financials"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
      <BusinessProfileHeader interpretation={interpretation} onNavigate={onNavigate} profile={profile} />
      <BusinessJourneyStepper steps={steps} />

      <div className="relative space-y-2.5">
        <div className="absolute left-[9px] top-3 hidden h-[calc(100%-12px)] w-px bg-border-soft md:block" />

        <section id="business-step-1">
          <StepSection step={steps[0]}>
            <BusinessCustomerProductSection profile={profile} />
          </StepSection>
        </section>

        <section id="business-step-2">
          <StepSection step={steps[1]}>
            <BusinessMoneyFlowSection profile={profile} />
          </StepSection>
        </section>

        <section id="business-step-3">
          <StepSection step={steps[2]}>
            <BusinessCompetitivePositionSection profile={profile} />
          </StepSection>
        </section>

        <section id="business-step-4">
          <StepSection step={steps[3]}>
            <BusinessConditionSection profile={profile} />
          </StepSection>
        </section>

        <section id="business-step-5">
          <StepSection step={steps[4]}>
            <BusinessNextFinancialCheckSection profile={profile} onNavigate={onNavigate} />
          </StepSection>
        </section>

        <div className="flex items-center justify-end gap-2 px-1 pt-1">
          <Button size="sm" variant="secondary" onClick={() => onNavigate("screening")}>
            Quay lại Lọc cổ phiếu
          </Button>
        </div>
      </div>
    </div>
  );
}
