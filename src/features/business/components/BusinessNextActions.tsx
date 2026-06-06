import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { BusinessNextActionsData } from "../types";

type BusinessNextActionsProps = {
  data: BusinessNextActionsData;
};

export function BusinessNextActions({ data }: BusinessNextActionsProps) {
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
