import { Button } from "@/components/ui";
import type { ValuationNextStepAction } from "../types";

type ValuationNextStepActionsProps = {
  data: ValuationNextStepAction[];
  onNavigate?: (moduleKey: string) => void;
};

export function ValuationNextStepActions({ data, onNavigate }: ValuationNextStepActionsProps) {
  return (
    <section className="flex flex-wrap gap-2">
      {data.map((action) => (
        <Button
          key={action.label}
          data-module-key={action.moduleKey}
          data-testid="module-cta"
          size="sm"
          variant={action.variant}
          onClick={() => onNavigate?.(action.moduleKey)}
        >
          {action.label}
        </Button>
      ))}
    </section>
  );
}
