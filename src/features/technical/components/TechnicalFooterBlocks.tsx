import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { TechnicalDisclaimerData, TechnicalNextActionsData } from "../types";

export function TechnicalDisclaimer({ data }: { data: TechnicalDisclaimerData }) {
  return (
    <Card>
      <CardHeader icon="!" title={data.title} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}

export function TechnicalNextActions({
  canContinueToRisk = false,
  data,
}: {
  data: TechnicalNextActionsData;
  canContinueToRisk?: boolean;
}) {
  const primaryAction = canContinueToRisk
    ? data.actions.find((action) => action.label.includes("Rủi ro")) ?? data.actions[0]
    : data.actions.find((action) => action.label.includes("Ghi chú")) ?? data.actions[0];
  const secondaryActions = data.actions.filter((action) => action.label !== primaryAction.label);

  return (
    <Card>
      <CardHeader description={data.description} icon="→" title={data.title} />
      <CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            disabled={primaryAction.disabled || (!canContinueToRisk && primaryAction.label.includes("Rủi ro"))}
            variant="primary"
          >
            {primaryAction.label}
          </Button>
          <div className="flex flex-wrap gap-2">
            {secondaryActions.map((action) => (
              <Button
                key={action.label}
                disabled={action.disabled || (!canContinueToRisk && action.label.includes("Rủi ro"))}
                variant="secondary"
              >
                {action.label.includes("Rủi ro") && !canContinueToRisk ? "Hoàn thành quan sát PVT" : action.label}
              </Button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
