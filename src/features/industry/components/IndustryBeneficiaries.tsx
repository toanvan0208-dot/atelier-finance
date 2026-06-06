import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { IndustryBeneficiariesData, IndustryGroupImpact } from "../types";

type IndustryBeneficiariesProps = {
  data: IndustryBeneficiariesData;
};

function GroupList({
  items,
  title,
  variant,
}: {
  items: IndustryGroupImpact[];
  title: string;
  variant: "success" | "danger";
}) {
  return (
    <div>
      <Chip variant={variant}>{title}</Chip>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
          >
            <h3 className="text-sm font-bold text-ink">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function IndustryBeneficiaries({ data }: IndustryBeneficiariesProps) {
  return (
    <Card>
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <GroupList
            items={data.beneficiaries}
            title={data.beneficiariesTitle}
            variant="success"
          />
          <GroupList
            items={data.disadvantaged}
            title={data.disadvantagedTitle}
            variant="danger"
          />
        </div>
      </CardBody>
    </Card>
  );
}
