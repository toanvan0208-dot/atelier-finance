import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { AnalysisModuleCompletion } from "../types";
import {
  canUnlockFullSimulationChecklist,
  canUnlockStandardChecklist,
  getModuleCompletionStatus,
} from "../utils/moduleCompletionGate";

type ChecklistModuleGateProps = {
  modules: AnalysisModuleCompletion[];
  onNavigate: (key: string) => void;
};

const statusLabel = {
  not_started: "Chưa hoàn thành",
  in_progress: "Đang làm",
  minimum_completed: "Đủ tối thiểu",
  completed: "Đã hoàn thành",
  needs_update: "Cần cập nhật",
};

const statusVariant = {
  not_started: "neutral",
  in_progress: "warning",
  minimum_completed: "success",
  completed: "success",
  needs_update: "danger",
} as const;

export function ChecklistModuleGate({
  modules,
  onNavigate,
}: ChecklistModuleGateProps) {
  const standardUnlocked = canUnlockStandardChecklist(modules);
  const fullUnlocked = canUnlockFullSimulationChecklist(modules);
  const completedCount = modules.filter(
    (module) => getModuleCompletionStatus(module) === "completed"
  ).length;

  return (
    <Card>
      <CardHeader
        icon="G"
        title="Điều kiện bắt buộc trước kiểm tra"
        description="Checklist đọc trạng thái hoàn thành theo từng mã cổ phiếu, không dùng trạng thái tổng của shell."
        chip={<Chip variant={standardUnlocked ? "success" : "warning"}>{standardUnlocked ? "Đủ tiêu chuẩn" : "Đang khóa"}</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Hoàn thành đầy đủ</p>
            <p className="mt-1 text-xl font-bold text-ink">{completedCount}/{modules.length}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Kiểm tra tiêu chuẩn</p>
            <p className="mt-1 text-sm font-bold text-ink">{standardUnlocked ? "Đã mở" : "Chưa đủ điều kiện"}</p>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Full trước mô phỏng</p>
            <p className="mt-1 text-sm font-bold text-ink">{fullUnlocked ? "Đã mở" : "Cần hoàn thành đủ"}</p>
          </div>
        </div>

        <div className="grid gap-2">
          {modules.map((module) => {
            const status = getModuleCompletionStatus(module);
            const note =
              module.missingOutputs.length > 0
                ? `Thiếu: ${module.missingOutputs.join(", ")}`
                : module.summary ?? "Đã có output bắt buộc.";

            return (
              <div
                key={module.moduleKey}
                className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:grid-cols-[180px_130px_minmax(0,1fr)_auto] md:items-center"
              >
                <p className="text-sm font-bold text-ink">{module.moduleName}</p>
                <Chip size="sm" variant={statusVariant[status]}>{statusLabel[status]}</Chip>
                <p className="text-xs leading-5 text-muted">{note}</p>
                <Button size="sm" variant="secondary" onClick={() => onNavigate(module.navigateTo)}>
                  Mở module này
                </Button>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
