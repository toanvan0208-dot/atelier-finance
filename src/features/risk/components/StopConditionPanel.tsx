import { Card, CardBody, CardHeader, Chip } from "@/components/ui";

type StopConditionPanelProps = {
  stopConditions: string[];
  reverseRiskNote: string;
};

export function StopConditionPanel({
  reverseRiskNote,
  stopConditions,
}: StopConditionPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Quy tắc dừng"
        description="Chỉ giữ các ngưỡng khiến người dùng không nên viết nhận định ở trang này."
      />
      <CardBody className="space-y-3">
        <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Không kết luận nếu còn vướng</p>
            <Chip size="sm" variant="warning">Dừng</Chip>
          </div>
          <div className="mt-3 space-y-2">
            {stopConditions.map((condition) => (
              <p key={condition} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                {condition}
              </p>
            ))}
          </div>
        </div>
        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted">
          <span className="font-bold text-ink">Câu hỏi tự kiểm: </span>
          {reverseRiskNote}
        </p>
      </CardBody>
    </Card>
  );
}
