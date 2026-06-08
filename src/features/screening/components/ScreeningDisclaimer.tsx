import { Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningDisclaimerData } from "../types";

type ScreeningDisclaimerProps = {
  data: ScreeningDisclaimerData;
};

export function ScreeningDisclaimer({ data }: ScreeningDisclaimerProps) {
  return (
    <Card className="bg-warning/10">
      <CardHeader className="py-3" icon={data.icon} title={data.title} />
      <CardBody className="py-4">
        <p className="text-xs leading-6 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}
