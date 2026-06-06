import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type {
  ScreeningDeepDiveStep,
  ScreeningFunnelStepLabels,
} from "../types";

type ScreeningFunnelStepProps = {
  labels: ScreeningFunnelStepLabels;
  step: ScreeningDeepDiveStep;
};

function StepField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
        {label}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">{value}</p>
    </div>
  );
}

export function ScreeningFunnelStep({
  labels,
  step,
}: ScreeningFunnelStepProps) {
  return (
    <Card>
      <CardHeader
        chip={<Chip variant="accent">{step.step}</Chip>}
        description={step.mainQuestion}
        title={step.title}
      />
      <CardBody className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StepField label={labels.goal} value={step.goal} />
          <StepField label={labels.resultStatus} value={step.resultStatus} />
        </div>

        <p className="text-sm leading-6 text-muted">{step.explanation}</p>

        {step.outputs ? (
          <div className="flex flex-wrap gap-2">
            {step.outputs.map((output) => (
              <Chip key={output} size="sm" variant="neutral">
                {output}
              </Chip>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
