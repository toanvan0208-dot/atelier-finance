import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockChecklistResult } from "../types";

type ChecklistProgressSidebarProps = {
  result: StockChecklistResult;
};

export function ChecklistProgressSidebar({ result }: ChecklistProgressSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader
          icon="P"
          title="Tiến độ tạm thời"
          description="Theo dõi độ đủ dữ liệu trong lúc làm bài."
          chip={<Chip variant={result.fomoWarning ? "warning" : "neutral"}>{result.mode === "standard" ? "Tiêu chuẩn" : "Full"}</Chip>}
        />
        <CardBody className="space-y-3">
          <Metric label="Câu đã trả lời" value={`${result.answeredQuestions}/${result.totalQuestions}`} />
          <Metric label="Chưa chắc" value={`${result.unsureCount}`} />
          <Metric label="Thiếu quan trọng" value={`${result.missingCriticalCount}`} />
          <Metric label="Cảnh báo FOMO" value={result.fomoWarning ? "Có" : "Không"} />
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold text-ink">Module có thể cần quay lại</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.modulesToRevisit.length > 0 ? (
                result.modulesToRevisit.map((module) => (
                  <Chip key={module} size="sm" variant="warning">{module}</Chip>
                ))
              ) : (
                <Chip size="sm" variant="success">Chưa có</Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase text-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
