"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  ScreeningStock,
  ScreeningStockCardLabels,
  ScreeningTickerInputData,
  StockFunnelReview,
} from "../types";

type TickerQuickCheckProps = {
  data: ScreeningTickerInputData;
  labels: ScreeningStockCardLabels;
  selectedTicker: string | null;
  stocksByTicker: Record<string, ScreeningStock>;
  onSelectTicker: (ticker: string | null) => void;
  onOpenFunnel: () => void;
};

function statusTone(status: StockFunnelReview["status"]) {
  if (status.includes("Đạt")) return "success";
  if (status.includes("Cần")) return "warning";
  if (status.includes("Cảnh")) return "danger";
  return "neutral";
}

export function TickerQuickCheck({
  data,
  labels,
  onOpenFunnel,
  onSelectTicker,
  selectedTicker,
  stocksByTicker,
}: TickerQuickCheckProps) {
  const [tickerInput, setTickerInput] = useState(selectedTicker ?? "");
  const [error, setError] = useState("");
  const selectedStock = selectedTicker ? stocksByTicker[selectedTicker] : null;

  const sameSectorStocks = useMemo(() => {
    if (!selectedStock) return [];

    return Object.values(stocksByTicker)
      .filter((stock) => stock.sector === selectedStock.sector && stock.ticker !== selectedStock.ticker)
      .slice(0, 3);
  }, [selectedStock, stocksByTicker]);

  const funnelColumns: Array<DataTableColumn<StockFunnelReview>> = [
    {
      key: "layer",
      header: "Cửa sơ lọc",
      cell: (row) => <span className="font-medium text-ink">{row.layer}</span>,
    },
    {
      key: "status",
      header: "Kết quả",
      cell: (row) => <Chip size="sm" variant={statusTone(row.status)}>{row.status}</Chip>,
    },
  ];

  function submitTicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTicker = tickerInput.trim().toUpperCase();
    setTickerInput(normalizedTicker);

    if (!normalizedTicker) {
      setError(data.emptyError);
      onSelectTicker(null);
      return;
    }

    if (normalizedTicker.length < 3 || normalizedTicker.length > 10) {
      setError(data.lengthError);
      onSelectTicker(null);
      return;
    }

    if (!stocksByTicker[normalizedTicker]) {
      setError(data.missingError);
      onSelectTicker(null);
      return;
    }

    setError("");
    onSelectTicker(normalizedTicker);
  }

  return (
    <Card>
      <CardHeader description={data.description} icon="M" title={data.title} />
      <CardBody className="space-y-5">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={submitTicker}>
          <label className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
              {data.label}
            </span>
            <input
              className="h-11 rounded-[4px] border-[1.5px] border-border bg-surface px-3 font-mono text-sm font-bold uppercase text-ink outline-none transition focus:bg-accent-soft"
              maxLength={10}
              placeholder={data.placeholder}
              value={tickerInput}
              onChange={(event) => {
                setTickerInput(event.target.value.toUpperCase());
                setError("");
              }}
            />
          </label>
          <Button className="self-end" size="lg" type="submit">
            {data.buttonLabel}
          </Button>
        </form>

        <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          {data.helper}
        </p>

        {error ? (
          <p className="rounded-[4px] border border-danger bg-danger/10 px-3 py-2 text-xs font-semibold leading-5 text-danger">
            {error}
          </p>
        ) : null}

        {selectedStock ? (
          <section className="rounded-[4px] border-[1.5px] border-border bg-surface-soft">
            <div className="border-b border-border-soft px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
                    Kết quả kiểm tra nhanh: {selectedStock.ticker}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">
                    {selectedStock.companyName}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Mã này đã được chạy qua 5 cửa sơ lọc. Đây chưa phải kết luận hành động.
                  </p>
                </div>
                <Chip variant={selectedStock.groupKey === "priority" ? "success" : selectedStock.groupKey === "review" ? "warning" : "danger"}>
                  {selectedStock.classification}
                </Chip>
              </div>
            </div>

            <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-subtle">Ngành</p>
                    <p className="mt-1 text-sm font-bold text-ink">{selectedStock.sector}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-subtle">Nhóm</p>
                    <p className="mt-1 text-sm font-bold text-ink">{selectedStock.classification}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-subtle">{labels.reason}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{selectedStock.mainReason}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-subtle">{labels.needToCheck}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{selectedStock.needToCheck}</p>
                  </div>
                </div>
                <p className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                  {labels.note}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={onOpenFunnel}>
                    Xem 5 cửa sơ lọc
                  </Button>
                  <Button size="sm" variant="secondary">
                    Mở hồ sơ doanh nghiệp
                  </Button>
                  <Button size="sm" variant="ghost">
                    Thêm vào watchlist
                  </Button>
                </div>
              </div>

              <DataTable
                caption={`5 cửa sơ lọc của ${selectedStock.ticker}`}
                columns={funnelColumns}
                getRowKey={(row) => row.layer}
                rows={selectedStock.funnel}
              />
            </div>

            {sameSectorStocks.length > 0 ? (
              <div className="border-t border-border-soft px-4 py-3">
                <p className="text-xs font-bold text-ink">Gợi ý mã cùng ngành để so sánh</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sameSectorStocks.map((stock) => (
                    <Chip key={stock.ticker} variant="neutral">
                      {stock.ticker} - {stock.classification}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}
