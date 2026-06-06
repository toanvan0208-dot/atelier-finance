import { Card, CardBody, CardHeader, Chip, EmptyState } from "@/components/ui";
import type {
  ScreeningEmptyStateData,
  ScreeningResultGroupLabels,
  ScreeningStockCardLabels,
  ScreeningStockGroup,
} from "../types";
import { ScreeningStockCard } from "./ScreeningStockCard";

type ScreeningResultGroupsProps = {
  emptyState: ScreeningEmptyStateData;
  groups: ScreeningStockGroup[];
  labels: ScreeningResultGroupLabels;
  stockCardLabels: ScreeningStockCardLabels;
};

export function ScreeningResultGroups({
  emptyState,
  groups,
  labels,
  stockCardLabels,
}: ScreeningResultGroupsProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.key}>
          <CardHeader
            chip={
              <Chip variant={group.tone}>
                {group.stocks.length} {labels.stockCountUnit}
              </Chip>
            }
            description={group.description}
            icon={group.icon}
            title={group.title}
          />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {group.criteria.map((criterion) => (
                <Chip key={criterion} size="sm" variant="neutral">
                  {criterion}
                </Chip>
              ))}
            </div>

            {group.stocks.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {group.stocks.map((stock) => (
                  <ScreeningStockCard
                    key={stock.ticker}
                    labels={stockCardLabels}
                    stock={stock}
                    tone={group.tone}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                description={emptyState.description}
                icon={emptyState.icon}
                title={emptyState.title}
              />
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
