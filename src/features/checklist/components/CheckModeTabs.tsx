import type { CheckThinkingMode } from "../types";

type CheckModeTabsProps = {
  activeMode: CheckThinkingMode;
  onModeChange: (mode: CheckThinkingMode) => void;
};

const tabs: Array<{ mode: CheckThinkingMode; label: string }> = [
  { mode: "understanding", label: "Kiểm tra hiểu biết" },
  { mode: "stock", label: "Kiểm tra cổ phiếu" },
];

export function CheckModeTabs({ activeMode, onModeChange }: CheckModeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[4px] border border-border-soft bg-surface px-2 py-2">
      {tabs.map((tab) => {
        const isActive = tab.mode === activeMode;

        return (
          <button
            key={tab.mode}
            className={[
              "rounded-[3px] px-4 py-2 text-sm font-bold transition",
              isActive ? "bg-accent text-ink shadow-hard-sm" : "text-muted hover:bg-surface-hover hover:text-ink",
            ].join(" ")}
            type="button"
            onClick={() => onModeChange(tab.mode)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
