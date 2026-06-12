import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockModuleReadiness, StockReadinessStatus } from "../types";

type ModuleReadinessMapProps = {
  modules: StockModuleReadiness[];
  onNavigate: (key: string) => void;
};

const statusLabel: Record<StockReadinessStatus, string> = {
  done: "Đã có",
  needs_review: "Cần xem lại",
  missing_data: "Thiếu dữ liệu",
  not_started: "Chưa làm",
};

const statusVariant: Record<StockReadinessStatus, "success" | "warning" | "danger" | "neutral"> = {
  done: "success",
  needs_review: "warning",
  missing_data: "danger",
  not_started: "neutral",
};

export function ModuleReadinessMap({ modules, onNavigate }: ModuleReadinessMapProps) {
  return (
    <Card>
      <CardHeader title="Bản đồ sẵn sàng theo module" description="Ưu tiên xử lý phần yếu, thiếu hoặc chưa bắt đầu." />
      <CardBody>
        {modules.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <div key={module.moduleKey} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-ink">{module.moduleName}</p>
                  <Chip size="sm" variant={statusVariant[module.status]}>
                    {statusLabel[module.status]}
                  </Chip>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{module.summary}</p>
                <div className="mt-3 h-2 rounded-full bg-neutral">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${module.confidence}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase text-subtle">Độ tự tin {module.confidence}%</p>
                {module.status !== "done" ? (
                  <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => onNavigate(module.moduleKey)}>
                    Mở module
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-sm text-muted">
            Chưa có readiness map cho mã này trong prototype.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
