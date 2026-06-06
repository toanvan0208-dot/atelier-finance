import { Chip } from "@/components/ui";
import type { DriverData } from "../types";
import { BusinessSectionCard } from "./BusinessSectionCard";

type DriverBlockProps = {
  data: DriverData;
};

function DriverList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item} variant="neutral">{item}</Chip>
      ))}
    </div>
  );
}

export function DriverBlock({ data }: DriverBlockProps) {
  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
            <p className="mb-3 text-sm font-bold text-ink">{data.revenueTitle}</p>
            <DriverList items={data.revenueDrivers} />
          </div>
          <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
            <p className="mb-3 text-sm font-bold text-ink">{data.costTitle}</p>
            <DriverList items={data.costDrivers} />
          </div>
        </div>
        <p className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          {data.note}
        </p>
      </div>
    </BusinessSectionCard>
  );
}
