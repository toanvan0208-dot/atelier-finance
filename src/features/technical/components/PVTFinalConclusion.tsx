import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTFinalConclusionData, PVTNextAction } from "../types";

type PVTFinalConclusionProps = {
  conclusion: PVTFinalConclusionData;
  actions: PVTNextAction[];
  onNavigate: (key: string) => void;
};

export function PVTFinalConclusion({
  actions,
  conclusion,
  onNavigate,
}: PVTFinalConclusionProps) {
  const rows = [
    { label: "Trạng thái hiện tại", value: conclusion.status },
    { label: "Điểm tích cực", value: conclusion.positive },
    { label: "Điểm cần thận trọng", value: conclusion.caution },
    { label: "Bước tiếp theo", value: conclusion.nextStep },
  ];

  return (
    <Card>
      <CardHeader
        title="Kết luận Price - Volume - Time"
        description="Tóm tắt ngắn để chọn bước tiếp theo trong hệ thống."
        chip={<Chip variant="accent">Tổng hợp cuối module</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <p className="text-[11px] font-bold uppercase text-subtle">{row.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink">{row.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          {actions.slice(0, 4).map((action) => (
            <Button
              key={action.label}
              data-module-key={action.moduleKey}
              data-testid="module-cta"
              variant={action.primary ? "primary" : "secondary"}
              onClick={() => onNavigate(action.moduleKey)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
