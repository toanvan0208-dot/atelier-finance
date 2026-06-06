import { Card, CardBody, CardHeader } from "@/components/ui";
import type { ScreeningContextData } from "../types";

type ScreeningContextSummaryProps = {
  data: ScreeningContextData;
};

export function ScreeningContextSummary({ data }: ScreeningContextSummaryProps) {
  return (
    <Card className="bg-accent-soft">
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.summary}</p>
      </CardBody>
    </Card>
  );
}
