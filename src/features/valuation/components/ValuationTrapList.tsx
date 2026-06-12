import { Card, CardBody } from "@/components/ui";
import type { ValuationTrapSimple } from "../types";

type ValuationTrapListProps = {
  data: ValuationTrapSimple[];
};

export function ValuationTrapList({ data }: ValuationTrapListProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-7 text-ink">Những bẫy dễ gặp khi nhìn định giá</h2>
        <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">
          Chỉ giữ các bẫy liên quan trực tiếp đến định giá, không phân tích lại rủi ro hay BCTC.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((trap) => (
          <Card key={trap.title} className="border-border-soft">
            <CardBody className="px-4 py-4">
              <h3 className="text-sm font-bold text-ink">{trap.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{trap.description}</p>
              {trap.targetModule ? (
                <p className="mt-2 text-xs font-semibold leading-5 text-subtle">
                  Kiểm tra sâu hơn ở module tương ứng: {trap.targetModule}
                </p>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
