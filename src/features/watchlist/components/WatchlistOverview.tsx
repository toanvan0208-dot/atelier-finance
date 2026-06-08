import { MetricCard } from "@/components/ui";
import type { OverviewItem } from "../types";

type WatchlistOverviewProps = {
  data: OverviewItem[];
};

export function WatchlistOverview({ data }: WatchlistOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <MetricCard
          key={item.title}
          description={item.description}
          icon={item.icon}
          status={item.status}
          title={item.title}
          value={item.value}
        />
      ))}
    </div>
  );
}
