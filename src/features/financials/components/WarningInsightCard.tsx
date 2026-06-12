import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { FinancialDeskWarning } from "../types";

type WarningInsightCardProps = {
  warning: FinancialDeskWarning;
  isOpen: boolean;
  onOpenCause: () => void;
};

const severityLabel: Record<FinancialDeskWarning["severity"], string> = {
  watch: "Theo dõi",
  risk: "Rủi ro",
  serious: "Ưu tiên",
};

const severityChip: Record<FinancialDeskWarning["severity"], "warning" | "danger"> = {
  watch: "warning",
  risk: "danger",
  serious: "danger",
};

const severityClass: Record<FinancialDeskWarning["severity"], string> = {
  watch: "border-warning/60 bg-warning/10",
  risk: "border-danger/50 bg-danger/5",
  serious: "border-danger bg-danger/10",
};

export function WarningInsightCard({ isOpen, onOpenCause, warning }: WarningInsightCardProps) {
  return (
    <article className={cn("rounded-[6px] border p-3", severityClass[warning.severity])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-ink">{warning.title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted">{warning.summary}</p>
        </div>
        <Chip size="sm" variant={severityChip[warning.severity]}>
          {severityLabel[warning.severity]}
        </Chip>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onOpenCause}>
          Xem nguyên nhân
        </Button>
        <a className="text-xs font-bold text-muted underline-offset-4 hover:text-ink hover:underline" href="#financial-reading-journey">
          Đến bước liên quan
        </a>
      </div>
      {isOpen ? <p className="mt-3 rounded-[4px] border border-border-soft bg-surface p-3 text-xs leading-5 text-muted">{warning.cause}</p> : null}
    </article>
  );
}
