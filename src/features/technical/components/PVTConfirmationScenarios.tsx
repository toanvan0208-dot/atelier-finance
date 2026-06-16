import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTObservationData } from "../types";

type PVTConfirmationScenariosProps = {
  confirmation: string[];
  invalidation: string[];
  scenarios: PVTObservationData["scenarios"];
};

export function PVTConfirmationScenarios({
  confirmation,
  invalidation,
  scenarios,
}: PVTConfirmationScenariosProps) {
  return (
    <Card>
      <CardHeader
        title="Cần quan sát điều gì tiếp theo?"
        description="Không hỏi hành động ngay; trước hết xác định điều kiện quan sát được xác nhận hay phủ nhận khi nào."
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ObservationList title="Điều kiện xác nhận" items={confirmation} tone="success" />
          <ObservationList title="Điều kiện phủ nhận" items={invalidation} tone="warning" />
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Kịch bản quan sát</p>
            <div className="mt-3 space-y-3">
              {scenarios.map((scenario) => (
                <div key={scenario.name} className="rounded-[3px] border border-border-soft bg-surface p-3">
                  <Chip size="sm" variant="neutral">{scenario.name}</Chip>
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink">{scenario.condition}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{scenario.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ObservationList({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "success" | "warning";
}) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{title}</p>
        <Chip size="sm" variant={tone}>{items.length} điểm</Chip>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
