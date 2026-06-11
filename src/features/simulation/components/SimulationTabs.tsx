import { Chip } from "@/components/ui";
import type { SimulationModeChoice, SimulationModeId } from "../types";

type SimulationTabsProps = {
  modes: SimulationModeChoice[];
  activeMode: SimulationModeId;
  onSelect: (mode: SimulationModeId) => void;
};

const shortTitle: Record<SimulationModeId, string> = {
  current: "Mô phỏng hiện tại",
  scenario: "Kịch bản có thể xảy ra",
  history: "Case lịch sử",
};

export function SimulationTabs({ modes, activeMode, onSelect }: SimulationTabsProps) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="flex overflow-x-auto border-b border-border-soft bg-surface-soft/70 px-3 pt-3">
        {modes.map((mode) => {
          const active = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              className={`min-w-[190px] rounded-t-[4px] border-x border-t px-4 py-3 text-left transition ${
                active
                  ? "border-border bg-surface text-ink"
                  : "border-border-soft bg-surface-soft text-muted hover:bg-surface"
              }`}
              type="button"
              onClick={() => onSelect(mode.id)}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{shortTitle[mode.id]}</p>
                {active ? <Chip size="sm" variant="accent">Đang mở</Chip> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5">{mode.primaryOutput}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
