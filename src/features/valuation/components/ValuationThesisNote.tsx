import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ValuationThesisNoteData } from "../types";

type ValuationThesisNoteProps = {
  data: ValuationThesisNoteData;
};

export function ValuationThesisNote({ data }: ValuationThesisNoteProps) {
  return (
    <Card className="border-border-soft">
      <CardHeader
        action={
          <AnalysisNotePopover
            contextTitle={data.title}
            moduleId="valuation-thesis-note"
            moduleName="Định giá"
            noteType="assumption"
            stockSymbol="MWG"
          />
        }
        description={data.description}
        icon="G"
        title={data.title}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[4px] bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Phương pháp chính</p>
            <p className="mt-1 text-sm font-bold text-ink">{data.primaryMethod}</p>
          </div>
          <div className="rounded-[4px] bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Vùng tham khảo</p>
            <p className="mt-1 text-sm font-bold text-ink">{data.referenceRange}</p>
          </div>
          <div className="rounded-[4px] bg-surface-soft px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Giả định quan trọng nhất</p>
            <p className="mt-1 text-sm font-bold text-ink">{data.keyAssumption}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-subtle">Điều kiện làm vùng giá thay đổi</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.changeConditions.map((item) => <Chip key={item} variant="warning">{item}</Chip>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-subtle">Bẫy cần theo dõi</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.trapsToWatch.map((item) => <Chip key={item} variant="neutral">{item}</Chip>)}
            </div>
          </div>
        </div>

        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Kết luận tạm thời</p>
          <p className="mt-1 text-sm font-bold leading-6 text-ink">{data.draftConclusion}</p>
        </div>
      </CardBody>
    </Card>
  );
}
