import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { FomoCheckItem } from "../types";

type FomoCheckPanelProps = {
  checks: FomoCheckItem[];
};

export function FomoCheckPanel({ checks }: FomoCheckPanelProps) {
  return (
    <Card>
      <CardHeader title="Kiểm tra FOMO" description="Nhận diện lý do hành động đến từ dữ liệu hay cảm xúc." />
      <CardBody className="space-y-3">
        {checks.length > 0 ? (
          checks.map((check) => (
            <div key={check.id} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="warning">FOMO</Chip>
                <p className="text-sm font-bold text-ink">{check.label}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{check.riskSignal}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-ink">{check.saferReframe}</p>
            </div>
          ))
        ) : (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-sm text-muted">
            Chưa có dữ liệu FOMO cho mã này.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
