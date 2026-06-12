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
    { label: "Rủi ro lớn nhất", value: conclusion.biggestRisk },
    { label: "Dữ liệu còn thiếu", value: conclusion.missingData },
    { label: "Điều làm thesis sai", value: conclusion.thesisBreaker },
    { label: "Mức sẵn sàng", value: conclusion.readiness },
    { label: "Bước tiếp theo", value: conclusion.nextStep },
  ];

  return (
    <Card>
      <CardHeader
        title="Kết luận rủi ro cuối module"
        description="Tổng hợp ngắn để biết nên quay lại đâu hoặc chuyển sang bước nào."
        chip={<Chip variant="warning">Chưa nên mô phỏng vội</Chip>}
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
