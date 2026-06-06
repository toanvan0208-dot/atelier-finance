import { Chip, MetricCard } from "@/components/ui";
import type { IndustryHealthData } from "../types";

type IndustryHealthScoreProps = {
  data: IndustryHealthData;
};

const statusVariant = {
  growth: "success",
  neutral: "warning",
  weakening: "danger",
} as const;

export function IndustryHealthScore({ data }: IndustryHealthScoreProps) {
  return (
    <MetricCard
      description={data.explanation}
      icon={data.icon}
      items={[
        {
          label: data.metricLabels.status,
          value: data.status,
        },
        {
          label: data.metricLabels.scale,
          value: data.scaleValue,
        },
      ]}
      status={
        <Chip variant={statusVariant[data.statusType]}>{data.status}</Chip>
      }
      title={data.title}
      value={`${data.score}${data.scoreUnit}`}
    />
  );
}
