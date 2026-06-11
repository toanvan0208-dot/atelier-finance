import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Chip } from "@/components/ui";
import type { PersonalFinancialsThesisData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type PersonalFinancialsThesisProps = {
  data: PersonalFinancialsThesisData;
};

export function PersonalFinancialsThesis({ data }: PersonalFinancialsThesisProps) {
  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.prompts.map((prompt) => (
            <Chip key={prompt} variant="neutral">{prompt}</Chip>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted">
            Ghi chú cá nhân về BCTC được đặt trong panel riêng để phần chính ưu tiên doanh thu, lợi nhuận, CFO, nợ vay và cảnh báo chất lượng lợi nhuận.
          </p>
          <AnalysisNotePopover
            contextTitle={data.title}
            moduleId="financials-personal-thesis"
            moduleName="BCTC"
            noteType="follow_up"
            stockSymbol="MWG"
          />
        </div>
      </div>
    </FinancialsSectionCard>
  );
}
