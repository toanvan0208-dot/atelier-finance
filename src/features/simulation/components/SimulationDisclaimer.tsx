import { Card, CardBody, CardHeader } from "@/components/ui";
import type { SimulationDisclaimerData } from "../types";

type SimulationDisclaimerProps = {
  data: SimulationDisclaimerData;
};

export function SimulationDisclaimer({ data }: SimulationDisclaimerProps) {
  return (
    <Card className="bg-surface-soft">
      <CardHeader icon="!" title={data.title} />
      <CardBody>
        <p className="text-xs leading-5 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}
