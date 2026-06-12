import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { MissingEvidenceQuestion } from "../types";

type MissingEvidencePanelProps = {
  questions: MissingEvidenceQuestion[];
  onNavigate: (key: string) => void;
};

export function MissingEvidencePanel({ onNavigate, questions }: MissingEvidencePanelProps) {
  return (
    <Card>
      <CardHeader title="Câu hỏi còn thiếu chứng cứ" description="Chỉ hỏi phần yếu nhất thay vì bắt làm lại toàn bộ." />
      <CardBody className="space-y-3">
        {questions.length > 0 ? (
          questions.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft p-4 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p className="text-sm font-bold leading-6 text-ink">{item.question}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.whyItMatters}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onNavigate(item.targetModule)}>
                Kiểm chứng
              </Button>
            </div>
          ))
        ) : (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 text-sm text-muted">
            Chưa có câu hỏi thiếu chứng cứ cho mã này.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
