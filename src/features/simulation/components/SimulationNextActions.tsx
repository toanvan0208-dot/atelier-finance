import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { SimulationNextActionsData } from "../types";

type SimulationNextActionsProps = {
  data: SimulationNextActionsData;
};

export function SimulationNextActions({ data }: SimulationNextActionsProps) {
  return (
    <Card>
      <CardHeader description={data.description} icon=">" title={data.title} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              size="sm"
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
