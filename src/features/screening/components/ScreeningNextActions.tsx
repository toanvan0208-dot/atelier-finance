"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ScreeningNextActionsData } from "../types";

type ScreeningNextActionsProps = {
  data: ScreeningNextActionsData;
};

export function ScreeningNextActions({ data }: ScreeningNextActionsProps) {
  const [selectedStock, setSelectedStock] = useState(data.stocks[0]?.value ?? "");

  return (
    <Card>
      <CardHeader description={data.description} icon={data.icon} title={data.title} />
      <CardBody className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-subtle">
            {data.selectedStockLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.stocks.map((stock) => (
              <Button
                key={stock.value}
                size="sm"
                variant={selectedStock === stock.value ? "primary" : "secondary"}
                onClick={() => setSelectedStock(stock.value)}
              >
                {stock.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.actions.map((action) => (
            <Button key={action.label} variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>

        {selectedStock ? <Chip variant="neutral">{selectedStock}</Chip> : null}
      </CardBody>
    </Card>
  );
}
