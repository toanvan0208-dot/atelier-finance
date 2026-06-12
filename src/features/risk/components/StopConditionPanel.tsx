import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { RiskTimelineData } from "../types";

type StopConditionPanelProps = {
  stopConditions: string[];
  timeline: RiskTimelineData;
  reverseRiskNote: string;
};

const timelineGroups = [
  { key: "shortTerm", title: "Ngắn hạn" },
  { key: "mediumTerm", title: "Trung hạn" },
  { key: "longTerm", title: "Dài hạn" },
] as const;

export function StopConditionPanel({
  reverseRiskNote,
  stopConditions,
  timeline,
}: StopConditionPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Khi nào chưa nên mô phỏng?"
        description="Các điều kiện dừng giúp tránh hành động vội khi dữ liệu chưa đủ."
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Điều kiện dừng</p>
            <div className="mt-3 space-y-2">
              {stopConditions.map((condition) => (
                <p key={condition} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                  {condition}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Rủi ro theo thời gian</p>
            <div className="mt-3 space-y-3">
              {timelineGroups.map((group) => (
                <div key={group.key}>
                  <Chip size="sm" variant="neutral">{group.title}</Chip>
                  <p className="mt-2 text-xs leading-5 text-muted">{timeline[group.key].join("; ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-xs leading-5 text-muted">
          <span className="font-bold text-ink">Rủi ro ngược: </span>
          {reverseRiskNote}
        </p>
      </CardBody>
    </Card>
  );
}
