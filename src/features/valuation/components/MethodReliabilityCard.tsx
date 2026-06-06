import { Chip } from "@/components/ui";
import type { ConfidenceData } from "../types";

type MethodReliability = ConfidenceData["methods"][number];

type MethodReliabilityCardProps = {
  method: MethodReliability;
};

export function MethodReliabilityCard({ method }: MethodReliabilityCardProps) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{method.method}</p>
        <Chip variant={method.tone}>{method.reliability}</Chip>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{method.reason}</p>
    </div>
  );
}
