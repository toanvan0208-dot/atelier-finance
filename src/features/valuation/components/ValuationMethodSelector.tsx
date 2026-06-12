import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationMethodChoice } from "../types";

type ValuationMethodSelectorProps = {
  data: ValuationMethodChoice[];
};

function roleVariant(role: ValuationMethodChoice["role"]) {
  if (role === "Chính") return "accent";
  if (role === "Chỉ tham khảo") return "neutral";
  return "warning";
}

export function ValuationMethodSelector({ data }: ValuationMethodSelectorProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-7 text-ink">Doanh nghiệp này nên định giá bằng phương pháp nào?</h2>
        <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
          Ưu tiên hiểu vì sao dùng phương pháp, không biến phần này thành bảng công thức.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.map((method) => (
          <Card key={method.name} className="border-border-soft">
            <CardBody className="space-y-3 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant={roleVariant(method.role)}>
                  {method.role}
                </Chip>
                <Chip size="sm" variant="neutral">
                  Tin cậy: {method.confidence}
                </Chip>
              </div>
              <h3 className="text-lg font-bold text-ink">{method.name}</h3>
              <p className="text-sm leading-6 text-muted">{method.explanation}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
