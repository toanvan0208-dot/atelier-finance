import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { FinancialsNextActionsData } from "../types";

type FinancialsNextActionsProps = {
  data: FinancialsNextActionsData;
};

export function FinancialsNextActions({ data }: FinancialsNextActionsProps) {
  return (
    <Card>
      <CardHeader description={data.description} icon={data.icon} title={data.title} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button key={action.label} variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
