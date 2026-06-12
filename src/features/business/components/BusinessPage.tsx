"use client";

import { useMemo, type ReactNode } from "react";
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
    <div className="relative flex w-10 shrink-0 justify-center">
      <div
        className={[
          "mt-2 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] text-sm font-bold",
          state === "current"
            ? "border-border bg-accent text-ink shadow-hard-sm"
            : state === "done"
              ? "border-accent-green bg-accent-green/10 text-accent-green"
              : "border-border-soft bg-surface text-muted",
        ].join(" ")}
      >
        {number}
      </div>
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
        "rounded-[4px] border px-3 py-3 text-center shadow-soft",
        accent
          ? "border-border bg-accent-soft text-ink"
          : "border-border-soft bg-surface-soft text-ink",
      ].join(" ")}
    >
      <p className="text-sm font-bold leading-5">{label}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
    </div>
  );
}

function SectionCard({
  step,
  children,
}: {
  step: JourneyStep;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[40px_minmax(0,1fr)]">
      <StepRail number={step.number} state={step.state} />
      <Card className={step.state === "current" ? "border-border bg-surface shadow-hard" : "border-border-soft"}>
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Chip variant={stateTone(step.state)}>{step.state === "done" ? "Đã đi qua" : step.state === "current" ? "Đang ở đây" : "Bước tiếp theo"}</Chip>
                <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                  Bước {step.number}
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold leading-8 text-ink">{step.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{step.question}</p>
            </div>
            <Button size="sm" variant={step.state === "current" ? "primary" : "secondary"} onClick={step.onCta}>
              {step.ctaLabel}
            </Button>
          </div>

          {children}
        </CardBody>
      </Card>
    </div>
  );
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const data = businessPageData;
  const routeProgress = useMemo(
    () => [
      { label: "Lọc cổ phiếu", state: "done" as const },
      { label: "Hiểu doanh nghiệp", state: "current" as const },
      { label: "Báo cáo tài chính", state: "upcoming" as const },
      { label: "Định giá", state: "upcoming" as const },
    ],
    []
  );

  const steps: JourneyStep[] = [
    {
      number: "01",
      title: "Kiếm tiền từ ai và bằng cách nào?",
      question: "Doanh nghiệp này kiếm tiền từ ai và bằng cách nào?",
      state: "done",
      ctaLabel: "Tiếp: Tiền đi qua mô hình này",
      onCta: () => {
        document.getElementById("business-step-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "02",
      title: "Tiền đi qua mô hình này như thế nào?",
      question: "Tiền đi qua mô hình kinh doanh này ra sao?",
      state: "current",
      ctaLabel: "Tiếp: Hơn hoặc kém đối thủ ở đâu?",
      onCta: () => {
        document.getElementById("business-step-3")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "03",
      title: "Doanh nghiệp có gì hơn hoặc kém đối thủ?",
      question: "Điều gì khiến doanh nghiệp mạnh hơn hoặc yếu hơn đối thủ?",
      state: "upcoming",
      ctaLabel: "Tiếp: Khi nào mô hình tốt hoặc xấu?",
      onCta: () => {
        document.getElementById("business-step-4")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "04",
      title: "Mô hình tốt lên hoặc xấu đi khi nào?",
      question: "Điều gì làm mô hình kinh doanh tốt lên hoặc xấu đi?",
      state: "upcoming",
      ctaLabel: "Tiếp: Sang Báo cáo tài chính",
      onCta: () => {
        document.getElementById("business-step-5")?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      number: "05",
      title: "Sang Báo cáo tài chính để kiểm chứng",
      question: "Báo cáo tài chính sẽ kiểm chứng các giả định ở bước trước như thế nào?",
      state: "upcoming",
      ctaLabel: "Sang Báo cáo tài chính",
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
    <div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 lg:px-0">
      <Card className="border-border-soft">
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {routeProgress.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2">
                <Chip variant={item.state === "current" ? "accent" : item.state === "done" ? "success" : "neutral"}>
                  {item.label}
                </Chip>
                {index < routeProgress.length - 1 ? <span className="text-sm font-bold text-subtle">→</span> : null}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-ink">
                Hiểu doanh nghiệp: {data.header.ticker}
              </h1>
              <p className="mt-2 max-w-[72ch] text-sm leading-6 text-muted">
                Bước này giúp bạn hiểu doanh nghiệp kiếm tiền bằng cách nào trước khi đọc báo cáo tài chính.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip variant="neutral">Bạn đang ở bước 2/4 của lộ trình phân tích</Chip>
                <Chip variant="accent">{data.header.companyName}</Chip>
                <Chip variant="neutral">{data.header.industry}</Chip>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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

      <div className="relative space-y-4">
        <div className="absolute left-5 top-4 hidden h-[calc(100%-16px)] w-px bg-border-soft md:block" />

        <section id="business-step-1">
          <SectionCard step={steps[0]}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Bán gì?</p>
                <p className="mt-2 text-base font-bold text-ink">Điện thoại</p>
                <p className="mt-1 text-base font-bold text-ink">Điện máy</p>
                <p className="mt-1 text-base font-bold text-ink">Hàng tiêu dùng</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Bán cho ai?</p>
                <p className="mt-2 text-base font-bold text-ink">Người tiêu dùng cá nhân</p>
                <p className="mt-1 text-base font-bold text-ink">Hộ gia đình</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Vì sao khách hàng mua?</p>
                <p className="mt-2 text-base font-bold text-ink">Tiện lợi</p>
                <p className="mt-1 text-base font-bold text-ink">Có thương hiệu</p>
                <p className="mt-1 text-base font-bold text-ink">Dễ bảo hành</p>
                <p className="mt-1 text-base font-bold text-ink">Dễ tiếp cận</p>
              </div>
            </div>

            <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
              <p className="text-sm font-bold text-ink">Hiểu sai thường gặp</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Doanh nghiệp nổi tiếng không đồng nghĩa cổ phiếu tốt.
              </p>
            </div>

            <div className="rounded-[4px] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold text-ink">Câu dẫn sang bước tiếp theo</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Biết doanh nghiệp bán gì và bán cho ai rồi. Tiếp theo cần hiểu tiền đi qua mô hình này như thế nào.
              </p>
            </div>
          </SectionCard>
        </section>

        <section id="business-step-2">
          <SectionCard step={steps[1]}>
            <div className="space-y-3">
              <div className="grid gap-2">
                <FlowNode label="Nhà cung cấp" />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Doanh nghiệp nhập hàng hoặc tạo dịch vụ" />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Kênh bán hàng" detail="Thế Giới Di Động · Điện Máy Xanh · Bách Hóa Xanh · Online" accent />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Khách hàng trả tiền" />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Doanh thu" accent />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Chi phí vận hành" detail="Giá vốn, nhân sự, mặt bằng, logistics, tồn kho" />
                <div className="text-center text-sm font-bold text-subtle">↓</div>
                <FlowNode label="Lợi nhuận và dòng tiền" accent />
              </div>

              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
                <p className="text-sm font-bold text-ink">Ví dụ với MWG</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Nhà cung cấp → MWG nhập hàng → Thế Giới Di Động, Điện Máy Xanh, Bách Hóa Xanh, Online → Khách hàng → Doanh thu → Giá vốn, nhân sự, mặt bằng, logistics, tồn kho → Lợi nhuận.
                </p>
              </div>

              <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
                <p className="text-sm font-bold text-ink">Hiểu sai thường gặp</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Doanh thu cao chưa chắc doanh nghiệp khỏe.
                </p>
              </div>

              <div className="rounded-[4px] border border-border bg-surface px-4 py-3">
                <p className="text-sm font-bold text-ink">Câu dẫn sang bước tiếp theo</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Nếu doanh nghiệp nào cũng có doanh thu và chi phí thì điều gì làm doanh nghiệp này khác đối thủ?
                </p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section id="business-step-3">
          <SectionCard step={steps[2]}>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm mạnh có thể có</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Thương hiệu", "Mạng lưới", "Kinh nghiệm vận hành", "Quan hệ nhà cung cấp", "Dữ liệu khách hàng"].map((item) => (
                    <Chip key={item} variant="neutral">
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Điểm yếu có thể có</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Chi phí vận hành lớn", "Biên lợi nhuận mỏng", "Phụ thuộc sức mua", "Tồn kho", "Cạnh tranh giá"].map((item) => (
                    <Chip key={item} variant="warning">
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Hướng đi tương lai</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                  <p>Đang mở rộng sang đâu?</p>
                  <p>Có liên quan tới năng lực hiện tại không?</p>
                  <p>Có tạo tiền thật không?</p>
                  <p>Có đủ nguồn lực để làm không?</p>
                </div>
              </div>
            </div>

            <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
              <p className="text-sm font-bold text-ink">Hiểu sai thường gặp</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Điểm mạnh hiện tại chưa chắc là lợi thế bền vững.
              </p>
            </div>

            <div className="rounded-[4px] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold text-ink">Câu dẫn sang bước tiếp theo</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Điểm mạnh và điểm yếu chỉ có ý nghĩa khi đặt trong điều kiện thực tế.
              </p>
            </div>
          </SectionCard>
        </section>

        <section id="business-step-4">
          <SectionCard step={steps[3]}>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình tốt lên khi</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                  {["Khách mua nhiều hơn", "Biên lợi nhuận tốt hơn", "Chi phí được kiểm soát", "Dòng tiền đều", "Mở rộng hợp lý"].map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Mô hình xấu đi khi</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                  {["Sức mua yếu", "Tồn kho tăng", "Giảm giá mạnh", "Chi phí tăng", "Mở rộng quá nhanh", "Tiền không về"].map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">Các dấu hiệu cần để ý</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {[
                  "Doanh thu",
                  "Biên lợi nhuận",
                  "Tồn kho",
                  "Dòng tiền",
                  "Nợ vay",
                  "Chi phí vận hành",
                ].map((item) => (
                  <div key={item} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                    <p className="text-sm font-bold text-ink">{item}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Chỉ cần hiểu vì sao nó quan trọng, chưa cần đi sâu số liệu ở bước này.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
              <p className="text-sm font-bold text-ink">Hiểu sai thường gặp</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Mô hình tốt trên lý thuyết chưa chắc đang tốt trong thực tế.
              </p>
            </div>

            <div className="rounded-[4px] border border-border bg-surface px-4 py-3">
              <p className="text-sm font-bold text-ink">Câu dẫn sang bước tiếp theo</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Muốn biết thực tế đang diễn ra như thế nào phải kiểm chứng bằng số liệu.
              </p>
            </div>
          </SectionCard>
        </section>

        <section id="business-step-5">
          <SectionCard step={steps[4]}>
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <p className="text-sm font-bold text-ink">Báo cáo tài chính sẽ giúp kiểm chứng</p>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                {[
                  "Doanh thu có thật sự tốt không.",
                  "Biên lợi nhuận có bền không.",
                  "Tồn kho có gây áp lực không.",
                  "Dòng tiền có đi cùng lợi nhuận không.",
                  "Nợ vay có an toàn không.",
                ].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onNavigate("financials")}>
                Sang Báo cáo tài chính
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Xem lại module Hiểu doanh nghiệp
              </Button>
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
}
