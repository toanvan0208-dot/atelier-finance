import { Button, Chip } from "@/components/ui";
import type { PossibleScenario } from "../types";

type ScenarioCardProps = {
  scenario: PossibleScenario;
  hasPosition: boolean;
  onUpdateStopLoss: () => void;
  onUpdateTarget: () => void;
  onClosePosition: () => void;
};

export function ScenarioCard({
  scenario,
  hasPosition,
  onClosePosition,
  onUpdateStopLoss,
  onUpdateTarget,
}: ScenarioCardProps) {
  return (
    <article className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-ink">{scenario.title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted">{scenario.condition}</p>
        </div>
        <Chip variant={scenario.type === "negative" || scenario.type === "stop_loss" ? "warning" : "neutral"}>
          {scenario.type}
        </Chip>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Dấu hiệu cần theo dõi</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
            {scenario.signalsToWatch.map((signal) => <li key={signal}>- {signal}</li>)}
          </ul>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Ảnh hưởng đến vị thế giả lập</p>
          <p className="mt-2 text-xs leading-5 text-muted">{scenario.impactOnPosition}</p>
        </div>
        <div className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Phản ứng mô phỏng nên cân nhắc</p>
          <p className="mt-2 text-xs leading-5 text-muted">{scenario.suggestedSimulationResponse}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
        <div className="flex flex-wrap gap-2">
          {scenario.relatedModules.map((module) => <Chip key={module} size="sm">{module}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={!hasPosition} onClick={onUpdateStopLoss}>Cập nhật stop-loss</Button>
          <Button size="sm" variant="secondary" disabled={!hasPosition} onClick={onUpdateTarget}>Cập nhật target</Button>
          <Button size="sm" variant="secondary" disabled={!hasPosition} onClick={onClosePosition}>Đóng vị thế giả lập</Button>
        </div>
      </div>
    </article>
  );
}
