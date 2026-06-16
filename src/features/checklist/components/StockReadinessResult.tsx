import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockFinalReadiness } from "../types";

type StockReadinessResultProps = {
  result: StockFinalReadiness;
  onNavigate: (key: string) => void;
};

const toneVariant: Record<StockFinalReadiness["tone"], "danger" | "warning" | "success" | "neutral"> = {
  danger: "danger",
  warning: "warning",
  success: "success",
  neutral: "neutral",
};

export function StockReadinessResult({ onNavigate, result }: StockReadinessResultProps) {
  return (
    <Card>
      <CardHeader
        title="Kết luận sẵn sàng"
        description="Kết luận này dùng để chọn bước kiểm tra tiếp theo, không phải kết luận hành động."
        chip={<Chip variant={toneVariant[result.tone]}>{result.label}</Chip>}
      />
      <CardBody className="space-y-4">
        <p className="text-sm leading-6 text-muted">{result.summary}</p>
        <div className="grid gap-2 md:grid-cols-3">
          {result.reasons.map((reason) => (
            <div key={reason} className="rounded-[4px] border border-border-soft bg-surface-soft p-3 text-xs font-semibold leading-5 text-ink">
              {reason}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
          {result.nextActions.map((action) => (
            <Button
              key={action.label}
              variant={action.primary ? "primary" : "secondary"}
              onClick={() => action.moduleKey && onNavigate(action.moduleKey)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
