import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ChecklistLogicGroup, ChecklistLogicStatus } from "../types";

type ChecklistLogicPanelProps = {
  groups: ChecklistLogicGroup[];
  onNavigate: (key: string) => void;
};

const statusLabel: Record<ChecklistLogicStatus, string> = {
  completed: "Đã có dữ liệu",
  needs_review: "Cần kiểm tra thêm",
  insufficient_data: "Chưa đủ dữ liệu",
  not_applicable: "Không phù hợp để diễn giải",
  unknown: "Chưa xác định",
};

const statusVariant: Record<ChecklistLogicStatus, "success" | "warning" | "danger" | "neutral"> = {
  completed: "success",
  needs_review: "warning",
  insufficient_data: "danger",
  not_applicable: "neutral",
  unknown: "neutral",
};

export function ChecklistLogicPanel({ groups, onNavigate }: ChecklistLogicPanelProps) {
  if (groups.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Checklist dữ liệu từ financial logic"
        description="Kết quả chỉ là tham chiếu để biết bước nào đủ dữ liệu, bước nào cần kiểm tra thêm và dữ liệu nào còn thiếu."
      />
      <CardBody className="space-y-4">
        {groups.map((group) => (
          <section key={group.id} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <div className="mb-3">
              <p className="text-sm font-bold text-ink">{group.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{group.summary}</p>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {group.steps.map((item) => (
                <div key={item.id} className="rounded-[3px] border border-border-soft bg-surface px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-bold leading-5 text-ink">{item.label}</p>
                    <Chip size="sm" variant={statusVariant[item.status]}>
                      {statusLabel[item.status]}
                    </Chip>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted">{item.value}</p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted">{item.summary}</p>
                  {item.missingFields.length > 0 ? (
                    <p className="mt-2 text-[11px] font-semibold text-subtle">
                      Thiếu: {item.missingFields.slice(0, 4).join(", ")}
                    </p>
                  ) : null}
                  {item.status !== "completed" ? (
                    <Button className="mt-3" size="sm" variant="secondary" onClick={() => onNavigate(item.targetModule)}>
                      Mở module liên quan
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
