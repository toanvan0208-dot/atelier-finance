import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { RiskRedesignTone, TransparencyGovernanceCheck as TransparencyItem } from "../types";

type TransparencyGovernanceCheckProps = {
  items: TransparencyItem[];
};

const toneVariant: Record<RiskRedesignTone, "success" | "warning" | "danger" | "neutral"> = {
  low: "success",
  caution: "warning",
  high: "danger",
  missing: "neutral",
};

export function TransparencyGovernanceCheck({ items }: TransparencyGovernanceCheckProps) {
  return (
    <Card>
      <CardHeader
        title="Minh bạch & quản trị"
        description="Kiểm tra dữ liệu và hành vi công bố thông tin có đủ đáng tin để dựa vào phân tích hay không."
      />
      <CardBody>
        <div className="grid gap-3 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <Chip size="sm" variant={toneVariant[item.tone]}>{item.status}</Chip>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{item.whyItMatters}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.dataToCheck.map((dataPoint) => (
                  <Chip key={dataPoint} size="sm" variant="neutral">{dataPoint}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
