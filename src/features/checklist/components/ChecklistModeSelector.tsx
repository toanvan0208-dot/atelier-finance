import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ChecklistMode, ChecklistModeId } from "../types";

type ChecklistModeSelectorProps = {
  modes: ChecklistMode[];
  selectedMode: ChecklistModeId | null;
  fullModeUnlocked: boolean;
  onSelect: (mode: ChecklistModeId) => void;
};

export function ChecklistModeSelector({
  fullModeUnlocked,
  modes,
  onSelect,
  selectedMode,
}: ChecklistModeSelectorProps) {
  return (
    <Card>
      <CardHeader
        icon="M"
        title="Chọn chế độ kiểm tra"
        description="Module hiện chỉ có đúng 2 chế độ. Không có kiểm tra nhanh hoặc chế độ quyết định thật riêng."
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2">
          {modes.map((mode) => {
            const disabled = mode.id === "full_before_simulation" && !fullModeUnlocked;
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                className={[
                  "rounded-[4px] border-[1.5px] px-4 py-4 text-left transition",
                  isSelected ? "border-border bg-accent-soft shadow-hard-sm" : "border-border-soft bg-surface-soft hover:border-border",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-ink">{mode.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{mode.description}</p>
                  </div>
                  <Chip size="sm" variant={isSelected ? "accent" : "neutral"}>
                    {mode.minQuestions}-{mode.maxQuestions} câu
                  </Chip>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-muted">{mode.structure}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{mode.bestFor}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Chip size="sm" variant="neutral">{mode.estimatedTime}</Chip>
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    disabled={disabled}
                    onClick={() => onSelect(mode.id)}
                  >
                    {disabled ? "Cần hoàn thành đủ module" : "Chọn chế độ này"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
