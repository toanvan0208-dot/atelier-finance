import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockReadinessData } from "../types";

type StockSelectorProps = {
  stocks: StockReadinessData[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
};

export function StockSelector({ onSelectTicker, selectedTicker, stocks }: StockSelectorProps) {
  const selectedStock = stocks.find((stock) => stock.ticker === selectedTicker) ?? stocks[0];

  return (
    <Card>
      <CardHeader
        title="Chọn mã cần kiểm tra"
        description="Prototype chỉ hỏi phần còn thiếu hoặc yếu, không lặp lại toàn bộ quy trình."
        chip={<Chip variant="neutral">Mock readiness</Chip>}
      />
      <CardBody className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <label>
          <span className="text-[11px] font-bold uppercase text-subtle">Mã cổ phiếu</span>
          <select
            className="mt-2 h-10 w-full rounded-[4px] border border-border bg-surface px-3 text-sm font-bold text-ink outline-none"
            value={selectedTicker}
            onChange={(event) => onSelectTicker(event.target.value)}
          >
            {stocks.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker}
              </option>
            ))}
          </select>
        </label>
        {selectedStock ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-xl font-bold text-ink">
              {selectedStock.ticker} · {selectedStock.companyName}
            </p>
            <p className="mt-1 text-xs font-bold uppercase text-subtle">{selectedStock.industry}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{selectedStock.currentThesis}</p>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
