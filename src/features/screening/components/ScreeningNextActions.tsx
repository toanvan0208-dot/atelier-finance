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
      <CardBody className="space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.actions.map((action) => (
            <button
              key={action.label}
              className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 text-left shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
              type="button"
            >
              <span className="block text-sm font-bold text-ink">{action.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {action.description}
              </span>
            </button>
          ))}
        </div>

        {selectedStock ? (
          <Chip variant="neutral">Đang định hướng bước tiếp theo cho {selectedStock}</Chip>
        ) : null}
      </CardBody>
    </Card>
  );
}
