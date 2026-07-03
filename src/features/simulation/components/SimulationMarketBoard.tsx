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
    <Card className="h-full">
      <CardHeader
        title="Bảng điện thị trường"
        description="Giá và thanh khoản lấy từ dữ liệu thị trường hiện có; chọn mã để tạo tình huống mô phỏng."
        chip={<Chip variant="accent">Dữ liệu thị trường</Chip>}
      />
      <CardBody className="p-0">
        {quotes.length === 0 ? (
          <div className="px-5 py-8">
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-5">
              <p className="text-sm font-bold text-ink">Chưa có dữ liệu bảng điện</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Khi hệ thống có MarketPrice mới nhất trong DB, giá và thanh khoản sẽ hiện ở đây. Không dùng dữ liệu giả thay thế.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-surface-soft text-[11px] uppercase text-subtle">
              <tr>
                {["Mã", "Tên doanh nghiệp", "Ngành", "Giá hiện tại", "+/-", "%", "Khối lượng", "GTGD", "Thanh khoản", "MA20", "MA50", "Volume/TB20", "Trạng thái"].map((header) => (
                  <th key={header} className="border-b border-border-soft px-3 py-3 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const selected = selectedSymbol === quote.symbol;

                return (
                  <tr
                    key={quote.symbol}
                    className={`cursor-pointer border-b border-border-soft transition hover:bg-accent-soft/40 ${
                      selected ? "bg-accent-soft/70" : "bg-surface"
                    }`}
                    onClick={() => onSelect(quote)}
                  >
                    <td className="px-3 py-3">
                      <p className="font-bold text-ink">{quote.symbol}</p>
                      <p className="text-[10px] text-subtle">{quote.exchange}</p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 font-semibold text-ink">{quote.name}</td>
                    <td className="px-3 py-3 text-muted">{quote.industry}</td>
                    <td className="px-3 py-3 font-bold text-ink">{formatNumber(quote.price)}</td>
                    <td className={`px-3 py-3 font-semibold ${toneFromSignedValue(quote.change)}`}>{formatNumber(quote.change)}</td>
                    <td className={`px-3 py-3 font-semibold ${toneFromSignedValue(quote.changePercent)}`}>{formatPercent(quote.changePercent)}</td>
                    <td className="px-3 py-3 text-muted">{formatNumber(quote.volume)}</td>
                    <td className="px-3 py-3 text-muted">{formatCompactCurrency(quote.tradingValue)}</td>
                    <td className="px-3 py-3">
                      <Chip size="sm" variant={quote.liquidityLabel === "Thấp" ? "warning" : quote.liquidityLabel === "Cao" ? "success" : "neutral"}>
                        {quote.liquidityLabel}
                      </Chip>
                    </td>
                    <td className="px-3 py-3 text-muted">{quote.ma20Status}</td>
                    <td className="px-3 py-3 text-muted">{quote.ma50Status}</td>
                    <td className="px-3 py-3 text-muted">{quote.volumeVsAvg20.toFixed(1).replace(".", ",")}x</td>
                    <td className="px-3 py-3">
                      <Chip size="sm" variant={statusVariant(quote.status)}>{stockStatusLabel(quote.status)}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function statusVariant(status: SimulatedStockQuote["status"]) {
  if (status === "has_position" || status === "near_target") return "success";
  if (status === "near_stop_loss" || status === "low_liquidity" || status === "need_review") return "warning";
  return "neutral";
}
