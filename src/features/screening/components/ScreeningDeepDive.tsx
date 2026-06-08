import { Card, CardBody, SectionHeader, StepAccordion } from "@/components/ui";
import type { StepAccordionItem } from "@/components/ui";
import type { ScreeningDeepDiveData } from "../types";

type ScreeningDeepDiveProps = {
  data: ScreeningDeepDiveData;
};

export function ScreeningDeepDive({ data }: ScreeningDeepDiveProps) {
  const items: StepAccordionItem[] = data.steps.map((step, index) => ({
    key: step.id,
    order: index + 1,
    title: step.title,
    status: "Có thể mở rộng",
    content: (
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            Giải thích đơn giản
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.explanation}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            Sai lầm người mới hay mắc
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.beginnerMistake}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            Tiêu chí hệ thống dùng
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {step.criteria.join(", ")}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            Ví dụ dễ hiểu
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">{step.example}</p>
        </div>
      </div>
    ),
  }));

  return (
    <section>
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <Card>
        <CardBody>
          <StepAccordion
            description="Mỗi tầng có tiêu chí, ví dụ và lỗi hiểu nhầm thường gặp."
            items={items}
            title="5 tầng lọc chi tiết"
          />
        </CardBody>
      </Card>
    </section>
  );
}
