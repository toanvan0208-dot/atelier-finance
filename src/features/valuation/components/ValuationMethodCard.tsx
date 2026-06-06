import { Chip } from "@/components/ui";
import type { ValuationMethod } from "../types";

type ValuationMethodCardProps = {
  method: ValuationMethod;
};

export function ValuationMethodCard({ method }: ValuationMethodCardProps) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-ink">{method.name}</h4>
        <Chip size="sm" variant={method.tone}>{method.reliability}</Chip>
      </div>
      <dl className="mt-3 space-y-2 text-xs leading-5 text-muted">
        <div><dt className="font-bold text-ink">Dùng để làm gì?</dt><dd>{method.purpose}</dd></div>
        <div><dt className="font-bold text-ink">Khi nào dùng?</dt><dd>{method.whenToUse}</dd></div>
        <div><dt className="font-bold text-ink">Khi nào dễ sai?</dt><dd>{method.failureMode}</dd></div>
        <div><dt className="font-bold text-ink">Vùng giá tham khảo</dt><dd>{method.range}</dd></div>
      </dl>
    </div>
  );
}
