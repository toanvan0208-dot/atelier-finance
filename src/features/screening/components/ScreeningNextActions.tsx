"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ScreeningMode, ScreeningNextActionsData, ScreeningOption } from "../types";

type ScreeningNextActionsProps = {
  data: ScreeningNextActionsData;
  mode: ScreeningMode;
  selectedTicker?: string | null;
  stocks: ScreeningOption[];
};

export function ScreeningNextActions({
  data,
  mode,
  selectedTicker,
  stocks,
}: ScreeningNextActionsProps) {
  const [selectedStock, setSelectedStock] = useState(stocks[0]?.value ?? "");
  const activeTicker = mode === "ticker" ? selectedTicker : selectedStock;
  const description = mode === "ticker" ? data.tickerDescription : data.contextDescription;
  const primaryAction = data.actions[0];
  const secondaryActions = data.actions.slice(1);

  return (
    <Card>
      <CardHeader description={description} icon={data.icon} title={data.title} />
      <CardBody className="space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
            {data.selectedStockLabel}
          </p>
          {mode === "context" ? (
            <div className="flex flex-wrap gap-2">
              {stocks.map((stock) => (
                <button
                  key={stock.value}
                  type="button"
                  className={[
                    "h-8 rounded-[3px] border-[1.5px] px-3 text-xs font-bold transition",
                    selectedStock === stock.value
                      ? "border-border bg-accent text-ink shadow-hard-sm"
                      : "border-border bg-surface text-ink shadow-hard-sm hover:bg-surface-hover",
                  ].join(" ")}
                  onClick={() => setSelectedStock(stock.value)}
                >
                  {stock.label}
                </button>
              ))}
            </div>
          ) : (
            <Chip variant={activeTicker ? "accent" : "neutral"}>
              {activeTicker ?? "Chưa có mã hợp lệ"}
            </Chip>
          )}
        </div>

        <div className="rounded-[4px] border border-accent bg-accent-soft px-4 py-4">
          <p className="text-sm font-bold text-ink">Bước tiếp theo được khuyến nghị</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {primaryAction?.description}
          </p>
          <div className="mt-3">
            <Button size="sm" variant="primary" disabled={!activeTicker}>
              {primaryAction?.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {secondaryActions.map((action) => (
            <button
              key={action.label}
              className="rounded-[4px] border border-border-soft bg-surface px-3 py-3 text-left transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!activeTicker}
            >
              <span className="block text-sm font-bold text-ink">{action.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {action.description}
              </span>
            </button>
          ))}
        </div>

        {activeTicker ? (
          <Chip variant="neutral">Đang định hướng bước tiếp theo cho {activeTicker}</Chip>
        ) : null}
      </CardBody>
    </Card>
  );
}
