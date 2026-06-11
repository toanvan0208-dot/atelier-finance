import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SimulationPhaseId, SimulationPhaseStatus } from "../types";

type SimulationPhaseCardProps = {
  id: SimulationPhaseId;
  title: string;
  goal: string;
  status: SimulationPhaseStatus;
  nextAction: string;
  isActive: boolean;
  onOpen: (id: SimulationPhaseId) => void;
};

const statusVariant: Record<SimulationPhaseStatus, "neutral" | "accent" | "success" | "warning"> = {
  "Chưa làm": "neutral",
  "Đang làm": "accent",
  "Tạm đủ": "success",
  "Cần bổ sung": "warning",
};

export function SimulationPhaseCard({
  id,
  title,
  goal,
  status,
  nextAction,
  isActive,
  onOpen,
}: SimulationPhaseCardProps) {
  return (
    <article className={cn("rounded-[4px] border bg-surface px-4 py-4", isActive ? "border-border shadow-soft" : "border-border-soft")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{goal}</p>
        </div>
        <Chip variant={statusVariant[status]}>{status}</Chip>
      </div>
      <p className="mt-3 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
        {nextAction}
      </p>
      <div className="mt-4">
        <Button size="sm" variant={isActive ? "primary" : "secondary"} onClick={() => onOpen(id)}>
          Mở chi tiết
        </Button>
      </div>
    </article>
  );
}
