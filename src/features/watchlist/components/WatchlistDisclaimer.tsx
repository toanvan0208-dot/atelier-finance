import { Card, CardBody, CardHeader } from "@/components/ui";
import type { WatchlistDisclaimerData } from "../types";

type WatchlistDisclaimerProps = {
  data: WatchlistDisclaimerData;
};

export function WatchlistDisclaimer({ data }: WatchlistDisclaimerProps) {
  return (
    <Card className="bg-surface-soft">
      <CardHeader icon="!" title={data.title} />
      <CardBody>
        <p className="text-xs leading-5 text-muted">{data.content}</p>
      </CardBody>
    </Card>
  );
}
