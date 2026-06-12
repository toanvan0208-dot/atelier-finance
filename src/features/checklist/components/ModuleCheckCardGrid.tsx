import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ThinkingModuleCard, ThinkingModuleId } from "../types";

type ModuleCheckCardGridProps = {
  modules: ThinkingModuleCard[];
  selectedModuleId: ThinkingModuleId;
  onSelectModule: (moduleId: ThinkingModuleId) => void;
};

const statusLabel: Record<ThinkingModuleCard["status"], string> = {
  ready: "Sẵn sàng",
  needs_practice: "Cần luyện",
  new: "Mới",
};

const statusVariant: Record<ThinkingModuleCard["status"], "success" | "warning" | "neutral"> = {
  ready: "success",
  needs_practice: "warning",
  new: "neutral",
};

export function ModuleCheckCardGrid({
  modules,
  onSelectModule,
  selectedModuleId,
}: ModuleCheckCardGridProps) {
  return (
    <Card>
      <CardHeader
        title="Chọn module muốn kiểm tra"
        description="Mỗi lượt chỉ mở một câu hỏi ngắn, không bung cả đề dài ngay từ đầu."
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const isActive = module.id === selectedModuleId;

            return (
              <button
                key={module.id}
                className={[
                  "min-h-[152px] rounded-[4px] border-[1.5px] p-4 text-left transition",
                  isActive
                    ? "border-border bg-accent-soft shadow-hard-sm"
                    : "border-border-soft bg-surface-soft hover:border-border",
                ].join(" ")}
                type="button"
                onClick={() => onSelectModule(module.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-[3px] border border-border-soft bg-surface px-2 py-1 text-xs font-bold text-ink">
                    {module.shortLabel}
                  </span>
                  <Chip size="sm" variant={statusVariant[module.status]}>
                    {statusLabel[module.status]}
                  </Chip>
                </div>
                <p className="mt-3 text-sm font-bold text-ink">{module.label}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{module.description}</p>
                <p className="mt-3 text-[11px] font-bold uppercase text-subtle">
                  {module.lastScore ? `Điểm gần nhất ${module.lastScore}/10` : "Chưa có điểm"}
                </p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
