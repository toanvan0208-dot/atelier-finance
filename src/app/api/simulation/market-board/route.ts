import { apiInternalError, apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/database/client";

type MarketBoardQuote = {
  change: number;
  changePercent: number;
  exchange: string;
  industry: string;
  liquidityLabel: "Thấp" | "Trung bình" | "Cao";
  ma20Status: "Trên MA20" | "Dưới MA20" | "Sát MA20";
  ma50Status: "Trên MA50" | "Dưới MA50" | "Sát MA50";
  name: string;
  price: number;
  status: "watching";
  symbol: string;
  tradingValue: number;
  volume: number;
  volumeVsAvg20: number;
};

const decimalToNumber = (value: { toNumber: () => number } | number | null | undefined): number | null => {
  if (typeof value === "number") return value;
  return value ? value.toNumber() : null;
};

const statusFromMa = (price: number, average: number | null): MarketBoardQuote["ma20Status"] => {
  if (!average || average <= 0) return "Sát MA20";
  const distance = (price - average) / average;
  if (Math.abs(distance) <= 0.01) return "Sát MA20";
  return distance > 0 ? "Trên MA20" : "Dưới MA20";
};

const statusFromMa50 = (price: number, average: number | null): MarketBoardQuote["ma50Status"] => {
  if (!average || average <= 0) return "Sát MA50";
  const distance = (price - average) / average;
  if (Math.abs(distance) <= 0.01) return "Sát MA50";
  return distance > 0 ? "Trên MA50" : "Dưới MA50";
};

const liquidityLabel = (tradingValue: number): MarketBoardQuote["liquidityLabel"] => {
  if (tradingValue >= 100_000_000_000) return "Cao";
  if (tradingValue >= 20_000_000_000) return "Trung bình";
  return "Thấp";
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

export const GET = async (): Promise<Response> => {
  try {
    const rows = await prisma.marketPrice.findMany({
      where: { closePrice: { not: null } },
      orderBy: [{ tradingDate: "desc" }, { updatedAt: "desc" }],
      take: 1200,
      include: {
        company: {
          select: {
            companyName: true,
            exchange: true,
            industryName: true,
          },
        },
      },
    });

    const byTicker = new Map<string, typeof rows>();
    for (const row of rows) {
      const bucket = byTicker.get(row.ticker) ?? [];
      if (bucket.length < 60) {
        bucket.push(row);
        byTicker.set(row.ticker, bucket);
      }
    }

    const quotes: MarketBoardQuote[] = [];
    for (const [ticker, series] of byTicker) {
      const latest = series[0];
      if (!latest) continue;

      const price = decimalToNumber(latest.closePrice);
      if (!price || price <= 0) continue;

      const previous = series[1];
      const previousClose = decimalToNumber(latest.previousClose) ?? decimalToNumber(previous?.closePrice) ?? null;
      const change = previousClose ? price - previousClose : 0;
      const closeSeries = series.map((row) => decimalToNumber(row.closePrice)).filter((value): value is number => Boolean(value && value > 0));
      const volumeSeries = series.map((row) => decimalToNumber(row.volume)).filter((value): value is number => value !== null && value >= 0);
      const ma20 = average(closeSeries.slice(0, 20));
      const ma50 = average(closeSeries.slice(0, 50));
      const avgVolume20 = average(volumeSeries.slice(0, 20));
      const volume = decimalToNumber(latest.volume) ?? 0;
      const tradingValue = decimalToNumber(latest.tradingValue) ?? (volume * price);

      quotes.push({
        change,
        changePercent: previousClose && previousClose > 0 ? (change / previousClose) * 100 : 0,
        exchange: latest.company.exchange ?? "HOSE",
        industry: latest.company.industryName ?? "Đang cập nhật",
        liquidityLabel: liquidityLabel(tradingValue),
        ma20Status: statusFromMa(price, ma20),
        ma50Status: statusFromMa50(price, ma50),
        name: latest.company.companyName,
        price,
        status: "watching",
        symbol: ticker,
        tradingValue,
        volume,
        volumeVsAvg20: avgVolume20 && avgVolume20 > 0 ? volume / avgVolume20 : 0,
      });
    }

    return apiSuccess(quotes.sort((a, b) => a.symbol.localeCompare(b.symbol)), {
      meta: {
        count: quotes.length,
        fallback: false,
        providerFetchAttempted: false,
        source: "market_price_latest_database",
      },
    });
  } catch {
    return apiInternalError();
  }
};
