import { Card, CardBody, CardHeader } from "@/components/ui";
import type { QuestionCountOption, ThinkingQuestionCount } from "../types";

type CheckSetupPanelProps = {
  options: QuestionCountOption[];
  selectedCount: ThinkingQuestionCount;
  onSelectCount: (count: ThinkingQuestionCount) => void;
};

export function CheckSetupPanel({
  onSelectCount,
  options,
  selectedCount,
}: CheckSetupPanelProps) {
  return (
    <Card>
      <CardHeader title="Thiết lập lượt kiểm tra" description="Mặc định là nhanh 5 câu." />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-3">
          {options.map((option) => {
            const isActive = option.value === selectedCount;

            return (
              <button
                key={option.value}
                className={[
                  "rounded-[4px] border p-4 text-left transition",
                  isActive ? "border-border bg-accent-soft" : "border-border-soft bg-surface-soft hover:border-border",
                ].join(" ")}
                type="button"
                onClick={() => onSelectCount(option.value)}
              >
                <p className="text-sm font-bold text-ink">{option.label}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{option.description}</p>
                <p className="mt-3 text-[11px] font-bold uppercase text-subtle">{option.estimatedTime}</p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
