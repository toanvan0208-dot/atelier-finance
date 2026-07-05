import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { RiskFinalConclusionData, RiskNextActionItem } from "../types";

type RiskFinalConclusionProps = {
  conclusion: RiskFinalConclusionData;
  actions: RiskNextActionItem[];
  onNavigate: (key: string) => void;
};

export function RiskFinalConclusion({
  actions,
  conclusion,
  onNavigate,
}: RiskFinalConclusionProps) {
  const rows = [
    { label: "Lý do chưa kết luận", value: conclusion.biggestRisk },
    { label: "Khoảng trống chính", value: conclusion.missingData },
    { label: "Điều kiện dừng", value: conclusion.thesisBreaker },
    { label: "Hành động tiếp theo", value: conclusion.nextStep },
  ];

  return (
    <Card>
      <CardHeader
        title="Chốt phiên kiểm tra"
        description="Kết luận của trang Risk chỉ là có được đi tiếp hay phải quay lại module nguồn."
        chip={<Chip variant="warning">Chưa đủ cơ sở kết luận</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <p className="text-[11px] font-bold uppercase text-subtle">{row.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink">{row.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          {actions.map((action) => (
            <Button
              key={action.label}
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
