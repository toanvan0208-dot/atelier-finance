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

export function TechnicalNextActions({ data }: { data: TechnicalNextActionsData }) {
  return (
    <Card>
      <CardHeader description={data.description} icon="→" title={data.title} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              variant={action.variant}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
