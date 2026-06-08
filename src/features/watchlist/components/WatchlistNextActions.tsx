import { Card, CardBody, CardHeader } from "@/components/ui";
import type { WatchlistNextActionsData } from "../types";
import { ActionButtons } from "./WatchlistPrimitives";

type WatchlistNextActionsProps = {
  data: WatchlistNextActionsData;
};

export function WatchlistNextActions({ data }: WatchlistNextActionsProps) {
  return (
    <Card>
      <CardHeader description={data.description} icon=">" title={data.title} />
      <CardBody>
        <ActionButtons actions={data.actions} />
      </CardBody>
    </Card>
  );
}
