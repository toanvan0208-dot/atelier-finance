import { Card, CardBody, CardHeader } from "@/components/ui";
import type { BusinessDisclaimerData } from "../types";

type BusinessDisclaimerProps = {
  data: BusinessDisclaimerData;
};

export function BusinessDisclaimer({ data }: BusinessDisclaimerProps) {
  return (
    <Card className="bg-warning/20">
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}
