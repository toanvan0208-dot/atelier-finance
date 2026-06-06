import { Card, CardBody, CardHeader } from "@/components/ui";
import type { FinancialsDisclaimerData } from "../types";

type FinancialsDisclaimerProps = {
  data: FinancialsDisclaimerData;
};

export function FinancialsDisclaimer({ data }: FinancialsDisclaimerProps) {
  return (
    <Card className="bg-warning/20">
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}
