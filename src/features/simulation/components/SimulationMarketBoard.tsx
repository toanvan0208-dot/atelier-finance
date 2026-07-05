import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { SimulatedStockQuote } from "../types";
import { formatCompactCurrency, formatNumber, formatPercent, stockStatusLabel, toneFromSignedValue } from "../utils";

type SimulationMarketBoardProps = {
  quotes: SimulatedStockQuote[];
  selectedSymbol?: string;
  onSelect: (quote: SimulatedStockQuote) => void;
};

export function SimulationMarketBoard({ quotes, selectedSymbol, onSelect }: SimulationMarketBoardProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader
        title="Chọn tình huống từ bảng điện"
        description="Dữ liệu lấy từ MarketPrice mới nhất trong DB. Chọn một mã để mô phỏng, không dùng dữ liệu giả thay thế."
        chip={<Chip variant="accent">Dữ liệu thị trường</Chip>}
      />
      <CardBody className="p-0">
        {quotes.length === 0 ? (
          <div className="px-5 py-8">
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-5">
              <p className="text-sm font-bold text-ink">Chưa có dữ liệu bảng điện</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Khi hệ thống có MarketPrice mới nhất trong DB, giá và thanh khoản sẽ hiện ở đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-auto p-3">
            <div className="grid gap-2">
              {quotes.map((quote) => {
                const selected = selectedSymbol === quote.symbol;

                return (
                  <button
                    key={quote.symbol}
                    className={`grid gap-3 rounded-[4px] border px-3 py-3 text-left transition ${
                      selected ? "border-border bg-accent-soft shadow-soft" : "border-border-soft bg-surface hover:border-border hover:bg-surface-soft"
                    }`}
                    type="button"
                    onClick={() => onSelect(quote)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-[4px] border text-sm font-bold ${
                          selected ? "border-border bg-accent text-ink" : "border-border-soft bg-surface-soft text-ink"
                        }`}>
                          {quote.symbol.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-ink">{quote.symbol}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">{quote.name}</p>
                        </div>
                      </div>
                      <Chip size="sm" variant={statusVariant(quote.status)}>{stockStatusLabel(quote.status)}</Chip>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <QuoteMetric label="Giá" value={formatNumber(quote.price)} />
                      <QuoteMetric
                        label="Phiên gần nhất"
                        value={formatPercent(quote.changePercent)}
                        valueClassName={toneFromSignedValue(quote.changePercent)}
                      />
                      <QuoteMetric label="Thanh khoản" value={quote.liquidityLabel} />
                    </div>

                    <div className="grid gap-1 border-t border-border-soft pt-2 text-[11px] text-muted">
                      <p>{quote.ma20Status} · {quote.ma50Status}</p>
                      <p>{formatNumber(quote.volume)} cp · {formatCompactCurrency(quote.tradingValue)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function QuoteMetric({
  label,
  value,
  valueClassName = "text-ink",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.03em] text-subtle">{label}</p>
      <p className={`mt-1 text-sm font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function statusVariant(status: SimulatedStockQuote["status"]) {
  if (status === "has_position" || status === "near_target") return "success";
  if (status === "near_stop_loss" || status === "low_liquidity" || status === "need_review") return "warning";
  return "neutral";
}
