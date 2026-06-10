"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  ScreeningComparisonAdvancedRow,
  ScreeningComparisonData,
  ScreeningComparisonSimpleRow,
  ScreeningMode,
  ScreeningStock,
} from "../types";

type ScreeningComparisonTableProps = {
  data: ScreeningComparisonData;
  mode: ScreeningMode;
  selectedStock?: ScreeningStock | null;
  stocksByTicker: Record<string, ScreeningStock>;
};

export function ScreeningComparisonTable({
  data,
  mode,
  selectedStock,
  stocksByTicker,
}: ScreeningComparisonTableProps) {
  const [tableMode, setTableMode] = useState<"simple" | "advanced">("simple");

  const simpleRows = useMemo<ScreeningComparisonSimpleRow[]>(() => {
    if (mode !== "ticker" || !selectedStock) return data.simpleRows;

    return Object.values(stocksByTicker)
      .filter((stock) => stock.sector === selectedStock.sector)
      .slice(0, 4)
      .map((stock) => ({
        ticker: stock.ticker,
        keptReason: stock.mainReason,
        needToCheck: stock.needToCheck,
        beginnerFit: stock.beginnerFitLevel,
        nextStep: stock.conclusion,
      }));
  }, [data.simpleRows, mode, selectedStock, stocksByTicker]);

  const advancedRows = useMemo<ScreeningComparisonAdvancedRow[]>(() => {
    if (mode !== "ticker" || !selectedStock) return data.advancedRows;

    return simpleRows.map((row) => ({
      ticker: row.ticker,
      financial: row.needToCheck.includes("dòng tiền") ? "Cần kiểm tra dòng tiền" : "Cần kiểm tra sơ bộ",
      valuation: "Cần kiểm tra",
      liquidity: "Đạt sơ bộ",
      catalyst: stocksByTicker[row.ticker]?.sector ?? selectedStock.sector,
      riskFit: row.beginnerFit === "Dễ hiểu" ? "Thấp - Trung bình" : "Trung bình - Cao",
    }));
  }, [data.advancedRows, mode, selectedStock, simpleRows, stocksByTicker]);

  const title =
    mode === "ticker" && selectedStock
      ? `So sánh ${selectedStock.ticker} với mã cùng ngành`
      : data.title;

  const simpleColumns: Array<DataTableColumn<ScreeningComparisonSimpleRow>> = [
    {
      key: "ticker",
      header: "Mã",
      cell: (row) => <span className="font-mono font-bold text-ink">{row.ticker}</span>,
    },
    {
      key: "keptReason",
      header: "Vì sao được giữ lại",
      cell: (row) => row.keptReason,
    },
    {
      key: "needToCheck",
      header: "Cần kiểm tra",
      cell: (row) => row.needToCheck,
    },
    {
      key: "beginnerFit",
      header: "Mức dễ hiểu",
      cell: (row) => row.beginnerFit,
    },
    {
      key: "nextStep",
      header: "Bước tiếp theo",
      cell: (row) => <span className="font-medium text-ink">{row.nextStep}</span>,
    },
  ];

  const advancedColumns: Array<DataTableColumn<ScreeningComparisonAdvancedRow>> = [
    {
      key: "ticker",
      header: "Mã",
      cell: (row) => <span className="font-mono font-bold text-ink">{row.ticker}</span>,
    },
    { key: "financial", header: "Tài chính sơ bộ", cell: (row) => row.financial },
    { key: "valuation", header: "Định giá sơ bộ", cell: (row) => row.valuation },
    { key: "liquidity", header: "Thanh khoản", cell: (row) => row.liquidity },
    { key: "catalyst", header: "Catalyst", cell: (row) => row.catalyst },
    { key: "riskFit", header: "Khẩu vị rủi ro", cell: (row) => row.riskFit },
  ];

  return (
    <Card>
      <CardHeader
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tableMode === "simple" ? "primary" : "secondary"}
              onClick={() => setTableMode("simple")}
            >
              Xem đơn giản
            </Button>
            <Button
              size="sm"
              variant={tableMode === "advanced" ? "primary" : "secondary"}
              onClick={() => setTableMode("advanced")}
            >
              Xem nâng cao
            </Button>
          </div>
        }
        description={data.description}
        icon={data.icon}
        title={title}
      />
      <CardBody>
        {tableMode === "simple" ? (
          <DataTable
            caption={data.caption}
            columns={simpleColumns}
            getRowKey={(row) => row.ticker}
            rows={simpleRows}
          />
        ) : (
          <DataTable
            caption={data.caption}
            columns={advancedColumns}
            getRowKey={(row) => row.ticker}
            rows={advancedRows}
          />
        )}
      </CardBody>
    </Card>
  );
}
