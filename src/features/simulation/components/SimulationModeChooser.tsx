import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SimulationModeChoice, SimulationModeId } from "../types";

type SimulationModeChooserProps = {
  modes: SimulationModeChoice[];
  activeMode: SimulationModeId;
  onSelect: (mode: SimulationModeId) => void;
};

const friendlyNames: Record<SimulationModeId, string> = {
  current: "Mô phỏng hiện tại",
  scenario: "Stress-test kịch bản",
  history: "Case lịch sử",
};

const beginnerHint: Record<SimulationModeId, string> = {
  current: "Người mới nên bắt đầu tại đây nếu đã có một mã muốn theo dõi.",
  scenario: "Đào sâu một rủi ro cụ thể để xem thesis còn đứng vững không.",
  history: "Dùng khi muốn luyện quyết định với dữ liệu quá khứ bị khóa.",
};

export function SimulationModeChooser({ modes, activeMode, onSelect }: SimulationModeChooserProps) {
  const selected = modes.find((mode) => mode.id === activeMode) ?? modes[0];

  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
          Bạn muốn luyện kỹ năng nào hôm nay?
        </p>
        <h2 className="mt-1 text-lg font-bold text-ink">Chọn chế độ mô phỏng</h2>
      </div>
      <div className="flex flex-wrap gap-2 rounded-[4px] border border-border-soft bg-surface-soft p-2">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              className={cn(
                "rounded-[3px] border px-3 py-2 text-xs font-bold transition",
                isActive ? "border-border bg-ink text-white shadow-soft" : "border-border-soft bg-surface text-muted hover:border-border hover:text-ink"
              )}
              type="button"
              onClick={() => onSelect(mode.id)}
              aria-pressed={isActive}
            >
              {friendlyNames[mode.id]}
            </button>
          );
        })}
      </div>
      <div className="rounded-[4px] border border-border-soft bg-accent-soft px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">{friendlyNames[selected.id]}</Chip>
          <Chip>{selected.primaryOutput}</Chip>
        </div>
        <p className="mt-3 text-sm font-bold text-ink">{selected.description}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{beginnerHint[selected.id]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.bestFor.map((item) => (
            <span key={item} className="rounded-[3px] border border-border-soft bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
