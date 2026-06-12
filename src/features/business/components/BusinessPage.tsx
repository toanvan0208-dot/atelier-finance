"use client";

import type { ReactNode } from "react";
import { Button, Card, CardBody, Chip, EmptyState, LoadingState } from "@/components/ui";
import { businessPageData } from "../data/business.data";

type BusinessPageProps = {
  onNavigate: (moduleKey: string) => void;
};

type JourneyState = "done" | "current" | "upcoming";

type JourneyStep = {
  number: string;
  title: string;
  question: string;
  state: JourneyState;
  ctaLabel: string;
  onCta: () => void;
};

function stateTone(state: JourneyState) {
  if (state === "done") return "success";
  if (state === "current") return "accent";
  return "neutral";
}

function StepRail({
  number,
  state,
}: {
  number: string;
  state: JourneyState;
}) {
  return (
    <div className="relative flex w-8 shrink-0 justify-center">
      <div
        className={[
          "mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-[11px] font-bold",
          state === "current"
            ? "border-border bg-accent text-ink shadow-hard-sm"
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

function StepBlock({
  step,
  children,
}: {
  step: JourneyStep;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[32px_minmax(0,1fr)]">
      <StepRail number={step.number} state={step.state} />
      <Card className={step.state === "current" ? "border-border bg-surface shadow-hard" : "border-border-soft"}>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip size="sm" variant={stateTone(step.state)}>
                  {step.state === "done" ? "Đã đi qua" : step.state === "current" ? "Đang ở đây" : "Bước tiếp theo"}
                </Chip>
                <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Bước {step.number}
                </span>
              </div>
              <h2 className="mt-1.5 text-xl font-bold leading-7 text-ink">{step.title}</h2>
              <p className="mt-1 text-sm leading-5 text-muted">{step.question}</p>
            </div>
          </div>

          {children}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-soft pt-2">
            <Button size="sm" variant={step.state === "current" ? "primary" : "secondary"} onClick={step.onCta}>
              {step.ctaLabel}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function FlowNode({
  label,
  detail,
  accent = false,
}: {
  label: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "min-h-[72px] rounded-[4px] border px-3 py-2.5 text-center shadow-soft",
        accent ? "border-border bg-accent-soft text-ink" : "border-border-soft bg-surface text-ink",
      ].join(" ")}
    >
      <p className="text-sm font-bold leading-5">{label}</p>
      {detail ? <p className="mt-1 text-[11px] leading-4 text-subtle">{detail}</p> : null}
    </div>
  );
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const data = businessPageData;

  const steps: JourneyStep[] = [
    {
      number: "01",
      title: "Kiếm tiền từ ai và bằng cách nào?",
      question: "Doanh nghiệp này kiếm tiền từ ai và bằng cách nào?",
      state: "done",
      ctaLabel: "Tiếp: Dòng tiền mô hình",
      onCta: () => {
        document.getElementById("business-step-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "02",
      title: "Tiền đi qua mô hình này như thế nào?",
      question: "Tiền đi qua mô hình kinh doanh này ra sao?",
      state: "current",
      ctaLabel: "Tiếp: Hơn/kém đối thủ",
      onCta: () => {
        document.getElementById("business-step-3")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "03",
      title: "Doanh nghiệp có gì hơn hoặc kém đối thủ?",
      question: "Điều gì khiến doanh nghiệp mạnh hơn hoặc yếu hơn đối thủ?",
      state: "upcoming",
      ctaLabel: "Tiếp: Khi nào tốt/xấu",
      onCta: () => {
        document.getElementById("business-step-4")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "04",
      title: "Mô hình tốt lên hoặc xấu đi khi nào?",
      question: "Điều gì làm mô hình kinh doanh tốt lên hoặc xấu đi?",
      state: "upcoming",
      ctaLabel: "Tiếp: Sang BCTC",
      onCta: () => {
        document.getElementById("business-step-5")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "05",
      title: "Sang Báo cáo tài chính để kiểm chứng",
      question: "Báo cáo tài chính sẽ kiểm chứng các giả định ở bước trước như thế nào?",
      state: "upcoming",
      ctaLabel: "Sang BCTC kiểm chứng",
      onCta: () => onNavigate("financials"),
    },
  ];

  if (data.isLoading) {
    return <LoadingState description={data.loading.description} title={data.loading.title} />;
  }

  if (!data.header.ticker) {
    return (
      <EmptyState
        description={data.emptyState.description}
        icon={data.emptyState.icon}
        title={data.emptyState.title}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-3 px-4 py-5 lg:px-0">
      <Card className="border-border-soft">
        <CardBody className="space-y-3">
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
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Hiểu doanh nghiệp: {data.header.ticker}
              </h1>
              <p className="mt-1.5 max-w-[72ch] text-sm leading-5 text-muted">
                Bước này giúp bạn hiểu doanh nghiệp kiếm tiền bằng cách nào trước khi đọc báo cáo tài chính.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Chip size="sm" variant="neutral">Bước 2/4</Chip>
                <Chip size="sm" variant="accent">{data.header.companyName}</Chip>
                <Chip size="sm" variant="neutral">{data.header.industry}</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => onNavigate("screening")}>
                Quay lại Lọc cổ phiếu
              </Button>
              <Button size="sm" variant="primary" onClick={() => onNavigate("financials")}>
                Sang Báo cáo tài chính
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="relative space-y-2.5">
        <div className="absolute left-4 top-3 hidden h-[calc(100%-12px)] w-px bg-border-soft md:block" />

        <section id="business-step-1">
          <StepBlock step={steps[0]}>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="min-h-[110px] rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Bán gì</p>
                <p className="mt-2 text-sm leading-5 text-ink">Điện thoại, điện máy, hàng tiêu dùng</p>
              </div>
              <div className="min-h-[110px] rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Bán cho ai</p>
                <p className="mt-2 text-sm leading-5 text-ink">Người tiêu dùng cá nhân, hộ gia đình</p>
              </div>
              <div className="min-h-[110px] rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Vì sao mua</p>
                <p className="mt-2 text-sm leading-5 text-ink">Tiện lợi, thương hiệu, bảo hành, dễ tiếp cận</p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hiểu sai thường gặp</p>
                <p className="mt-1 text-sm leading-5 text-ink">Doanh nghiệp nổi tiếng không đồng nghĩa cổ phiếu tốt.</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Tiếp theo</p>
                <p className="mt-1 text-sm leading-5 text-ink">Cần hiểu tiền đi qua mô hình này như thế nào.</p>
              </div>
            </div>
          </StepBlock>
        </section>

        <section id="business-step-2">
          <StepBlock step={steps[1]}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <FlowNode label="Nhà cung cấp" />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="MWG nhập hàng" accent />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="Kênh bán" detail="TGDD · DMX · BHX · Online" />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="Khách trả tiền" />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="Doanh thu" accent />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <FlowNode label="Doanh thu" />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="Chi phí vận hành" detail="Giá vốn, nhân sự, mặt bằng, logistics, tồn kho" />
                <span className="px-1 text-xs font-bold text-subtle">→</span>
                <FlowNode label="Lợi nhuận & dòng tiền" accent />
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Ví dụ với MWG</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Nhà cung cấp → MWG nhập hàng → Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh, Online → khách hàng → doanh thu → giá vốn, nhân sự, mặt bằng, logistics, tồn kho → lợi nhuận.
                </p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hiểu sai thường gặp</p>
                <p className="mt-1 text-sm leading-5 text-ink">Doanh thu cao chưa chắc doanh nghiệp khỏe.</p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Tiếp theo</p>
                <p className="mt-1 text-sm leading-5 text-ink">Cần xem doanh nghiệp hơn/kém đối thủ ở đâu.</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Nút tiếp tục</p>
                <Button size="sm" variant="secondary" onClick={steps[1].onCta}>
                  {steps[1].ctaLabel}
                </Button>
              </div>
            </div>
          </StepBlock>
        </section>

        <section id="business-step-3">
          <StepBlock step={steps[2]}>
            <div className="grid gap-2 lg:grid-cols-3">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm mạnh có thể có</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Thương hiệu, mạng lưới, kinh nghiệm vận hành, quan hệ nhà cung cấp, dữ liệu khách hàng.
                </p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm yếu có thể có</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Chi phí lớn, biên mỏng, phụ thuộc sức mua, tồn kho, cạnh tranh giá.
                </p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hướng đi tương lai</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Mở rộng có khớp năng lực hiện tại không, có tạo tiền thật không, có đủ nguồn lực không.
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hiểu sai thường gặp</p>
                <p className="mt-1 text-sm leading-5 text-ink">Điểm mạnh hiện tại chưa chắc là lợi thế bền vững.</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Tiếp theo</p>
                <p className="mt-1 text-sm leading-5 text-ink">Điểm mạnh và điểm yếu chỉ có ý nghĩa khi đặt trong điều kiện thực tế.</p>
              </div>
            </div>
          </StepBlock>
        </section>

        <section id="business-step-4">
          <StepBlock step={steps[3]}>
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình tốt lên khi</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Khách mua nhiều hơn, biên tốt hơn, chi phí được kiểm soát, dòng tiền đều, mở rộng hợp lý.
                </p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình xấu đi khi</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Sức mua yếu, tồn kho tăng, giảm giá mạnh, chi phí tăng, mở rộng quá nhanh, tiền không về.
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {[
                "Doanh thu",
                "Biên lợi nhuận",
                "Tồn kho",
                "Dòng tiền",
                "Nợ vay",
                "Chi phí vận hành",
              ].map((item) => (
                <div key={item} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">{item}</p>
                  <p className="mt-1 text-xs leading-4 text-subtle">Chỉ cần hiểu vì sao nó quan trọng ở bước này.</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Hiểu sai thường gặp</p>
                <p className="mt-1 text-sm leading-5 text-ink">Mô hình tốt trên lý thuyết chưa chắc đang tốt trong thực tế.</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Tiếp theo</p>
                <p className="mt-1 text-sm leading-5 text-ink">Muốn biết thực tế đang diễn ra như thế nào phải kiểm chứng bằng số liệu.</p>
              </div>
            </div>
          </StepBlock>
        </section>

        <section id="business-step-5">
          <StepBlock step={steps[4]}>
            <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">Báo cáo tài chính sẽ giúp kiểm chứng</p>
                <p className="mt-1 text-sm leading-5 text-ink">
                  Doanh thu có thật sự tốt không, biên lợi nhuận có bền không, tồn kho có gây áp lực không, dòng tiền có đi cùng lợi nhuận không, nợ vay có an toàn không.
                </p>
              </div>
              <Button variant="primary" onClick={() => onNavigate("financials")}>
                Sang BCTC kiểm chứng
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm leading-5 text-muted">Quay lại để rà soát lại mô hình nếu cần.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Xem lại module Hiểu doanh nghiệp
              </Button>
            </div>
          </StepBlock>
        </section>
      </div>
    </div>
  );
}
