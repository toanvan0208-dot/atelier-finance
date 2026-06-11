import { cn } from "@/lib/cn";
import type { LearningTabId } from "../types";

type LearningTabsProps = {
  activeTab: LearningTabId;
  onChange: (tab: LearningTabId) => void;
};

const tabs: Array<{ id: LearningTabId; label: string; description: string }> = [
  { id: "today", label: "Hôm nay học gì?", description: "Bài học đúng lúc." },
  { id: "roadmap", label: "Lộ trình nền tảng", description: "Học khi cần." },
  { id: "mistakes", label: "Sửa lỗi sai", description: "Sửa lỗi tư duy." },
  { id: "profile", label: "Năng lực của tôi", description: "Sẵn sàng theo module." },
];

export function LearningTabs({ activeTab, onChange }: LearningTabsProps) {
  return (
    <div className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft p-2 md:grid-cols-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={cn(
              "rounded-[3px] border px-3 py-2 text-left transition",
              isActive ? "border-border bg-ink text-white shadow-soft" : "border-border-soft bg-surface text-muted hover:border-border hover:text-ink"
            )}
            type="button"
            onClick={() => onChange(tab.id)}
          >
            <p className={cn("text-sm font-bold", isActive ? "text-white" : "text-ink")}>{tab.label}</p>
            <p className={cn("mt-1 text-[11px] leading-4", isActive ? "text-white/75" : "text-muted")}>{tab.description}</p>
          </button>
        );
      })}
    </div>
  );
}
