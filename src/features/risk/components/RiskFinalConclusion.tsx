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
    { label: "Điểm dễ kết luận vội nhất", value: conclusion.biggestRisk },
    { label: "Dữ liệu còn thiếu", value: conclusion.missingData },
    { label: "Điều kiện làm nhận định sai", value: conclusion.thesisBreaker },
    { label: "Mức sẵn sàng dữ liệu", value: conclusion.readiness },
    { label: "Bước tiếp theo", value: conclusion.nextStep },
  ];

  return (
    <Card>
      <CardHeader
        title="Kết luận dữ liệu có điều kiện"
        description="Tổng hợp ngắn để biết cần quay lại kiểm tra dữ liệu nào trước khi hình thành nhận định."
        chip={<Chip variant="warning">Chưa đủ cơ sở kết luận</Chip>}
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
