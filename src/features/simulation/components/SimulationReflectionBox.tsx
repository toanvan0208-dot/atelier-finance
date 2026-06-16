import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Chip } from "@/components/ui";
import type { AnalysisNote, AnalysisNoteType } from "@/types/analysis-note";
import type { ReflectionState } from "../types";

type SimulationReflectionBoxProps = {
  value: ReflectionState;
  onChange: (value: ReflectionState) => void;
};

const fields: Array<{
  key: keyof Omit<ReflectionState, "completed">;
  label: string;
  noteType: AnalysisNoteType;
}> = [
  { key: "initialThought", label: "Lý do và cảm xúc ban đầu", noteType: "personal" },
  { key: "emotionCheck", label: "Kiểm tra FOMO / cảm xúc", noteType: "personal" },
  { key: "processLesson", label: "Bài học quy trình", noteType: "lesson" },
  { key: "nextCheck", label: "Điều cần kiểm tra lần sau", noteType: "follow_up" },
];

export function SimulationReflectionBox({ value, onChange }: SimulationReflectionBoxProps) {
  function handleSave(fieldKey: keyof Omit<ReflectionState, "completed">, note: AnalysisNote) {
    onChange({ ...value, [fieldKey]: note.content });
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-ink">Nhật ký và hậu kiểm</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Các ghi chú cảm xúc, giả định và bài học được lưu trong panel riêng. Dữ liệu xác nhận, dữ liệu phủ định, rủi ro và mốc xem lại vẫn nằm trực tiếp trong phần thesis mô phỏng.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => {
          const hasContent = Boolean(value[field.key].trim());

          return (
            <div key={field.key} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{field.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {hasContent ? value[field.key] : "Chưa có ghi chú nào cho phần này."}
                  </p>
                </div>
                {hasContent ? <Chip size="sm" variant="accent">Có ghi chú</Chip> : null}
              </div>
              <div className="mt-3">
                <AnalysisNotePopover
                  contextTitle={field.label}
                  initialNote={
                    hasContent
                      ? {
                          id: `simulation-${field.key}`,
                          moduleId: `simulation-${field.key}`,
                          moduleName: "Mô phỏng",
                          type: field.noteType,
                          title: field.label,
                          content: value[field.key],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          stockSymbol: "MWG",
                        }
                      : undefined
                  }
                  moduleId={`simulation-${field.key}`}
                  moduleName="Mô phỏng"
                  noteType={field.noteType}
                  onSave={(note) => handleSave(field.key, note)}
                  stockSymbol="MWG"
                  triggerLabel="Ghi chú"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onChange({ ...value, completed: true })}>Đánh dấu đã hậu kiểm</Button>
      </div>
    </section>
  );
}
