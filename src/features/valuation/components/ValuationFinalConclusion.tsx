import { Card, CardBody, Chip } from "@/components/ui";
import type { ValuationFinalConclusionData } from "../types";

type ValuationFinalConclusionProps = {
  data: ValuationFinalConclusionData;
};

const rows = [
  { key: "pricePosition", label: "Giá hiện tại đang ở đâu?" },
  { key: "marginOfSafety", label: "Biên an toàn có đủ không?" },
  { key: "keyRisk", label: "Kết quả dễ sai vì điều gì?" },
  { key: "nextStep", label: "Có nên phân tích tiếp không?" },
] as const;

export function ValuationFinalConclusion({ data }: ValuationFinalConclusionProps) {
  return (
    <Card className="border-border bg-accent-soft">
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">Kết luận định giá cuối module</Chip>
          <Chip variant="warning">{data.status}</Chip>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <section key={row.key} className="rounded-[4px] border border-border-soft bg-surface px-4 py-3">
              <h3 className="text-sm font-bold text-ink">{row.label}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{data[row.key]}</p>
            </section>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
