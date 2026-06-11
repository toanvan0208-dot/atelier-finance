import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTCrossModuleAlignmentData, PVTCrossModuleAlignmentItem } from "../types";

type PVTCrossModuleAlignmentProps = {
  data: PVTCrossModuleAlignmentData;
};

const statusLabel: Record<PVTCrossModuleAlignmentItem["status"], string> = {
  aligned: "Khớp",
  unclear: "Chưa rõ",
  conflict: "Mâu thuẫn",
  needs_check: "Cần kiểm chứng",
};

const statusVariant: Record<PVTCrossModuleAlignmentItem["status"], "success" | "warning" | "danger" | "neutral"> = {
  aligned: "success",
  unclear: "neutral",
  conflict: "danger",
  needs_check: "warning",
};

export function PVTCrossModuleAlignment({ data }: PVTCrossModuleAlignmentProps) {
  return (
    <Card className="border-border-soft">
      <CardHeader description={data.description} icon="X" title={data.title} />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-ink">{item.module}</p>
                <Chip size="sm" variant={statusVariant[item.status]}>{statusLabel[item.status]}</Chip>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-ink">{item.question}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{item.observation}</p>
              {item.ctaLabel ? <p className="mt-2 text-[11px] font-bold text-accent">{item.ctaLabel}</p> : null}
            </div>
          ))}
        </div>
        <Button size="sm" variant="primary">{data.primaryCtaLabel}</Button>
      </CardBody>
    </Card>
  );
}
