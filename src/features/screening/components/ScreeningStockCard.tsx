import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ScreeningStock, ScreeningStockCardLabels } from "../types";

type ScreeningStockCardProps = {
  labels: ScreeningStockCardLabels;
  stock: ScreeningStock;
  tone: "success" | "warning" | "danger";
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="text-xs leading-5 text-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

function FieldTitle({ children }: { children: string }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-subtle">
      {children}
    </p>
  );
}

export function ScreeningStockCard({
  labels,
  stock,
  tone,
}: ScreeningStockCardProps) {
  return (
    <Card>
      <CardHeader
        chip={<Chip variant={tone}>{stock.classification}</Chip>}
        description={stock.companyName}
        title={stock.ticker}
      />
      <CardBody className="space-y-4">
        <p className="text-sm leading-6 text-muted">{stock.reason}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldTitle>{labels.strengths}</FieldTitle>
            <BulletList items={stock.strengths} />
          </div>
          <div>
            <FieldTitle>{labels.checks}</FieldTitle>
            <BulletList items={stock.checks} />
          </div>
        </div>

        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2">
          <FieldTitle>{labels.risks}</FieldTitle>
          <p className="mt-1 text-xs leading-5 text-muted">{stock.risks.join(", ")}</p>
        </div>

        <Chip variant="neutral">{stock.beginnerFit}</Chip>
      </CardBody>
    </Card>
  );
}
