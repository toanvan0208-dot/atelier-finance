import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";

type ReflectionBoxProps = {
  placeholder: string;
};

export function ReflectionBox({ placeholder }: ReflectionBoxProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-muted">{placeholder}</p>
      <AnalysisNotePopover
        contextTitle="Nhật ký mô phỏng"
        moduleId="simulation-reflection"
        moduleName="Mô phỏng"
        noteType="lesson"
        stockSymbol="MWG"
        triggerLabel="Ghi nhật ký"
      />
    </div>
  );
}
