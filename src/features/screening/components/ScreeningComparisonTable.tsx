"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  ScreeningComparisonAdvancedRow,
  ScreeningComparisonData,
  ScreeningComparisonSimpleRow,
} from "../types";

type ScreeningComparisonTableProps = {
  data: ScreeningComparisonData;
};

export function ScreeningComparisonTable({ data }: ScreeningComparisonTableProps) {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

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
      key: "keyStrength",
      header: "Điểm mạnh chính",
      cell: (row) => row.keyStrength,
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
      key: "conclusion",
      header: "Kết luận",
      cell: (row) => <span className="font-medium text-ink">{row.conclusion}</span>,
    },
  ];

  const advancedColumns: Array<DataTableColumn<ScreeningComparisonAdvancedRow>> = [
    {
      key: "criterion",
      header: data.advancedColumns.criterion,
      cell: (row) => <span className="font-medium text-ink">{row.criterion}</span>,
    },
    {
      key: "stockA",
      header: data.advancedColumns.stockA,
      cell: (row) => row.stockA,
    },
    {
      key: "stockB",
      header: data.advancedColumns.stockB,
      cell: (row) => row.stockB,
    },
    {
      key: "stockC",
      header: data.advancedColumns.stockC,
      cell: (row) => row.stockC,
    },
  ];

  return (
    <Card>
      <CardHeader
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "simple" ? "primary" : "secondary"}
              onClick={() => setMode("simple")}
            >
              Xem đơn giản
            </Button>
            <Button
              size="sm"
              variant={mode === "advanced" ? "primary" : "secondary"}
              onClick={() => setMode("advanced")}
            >
              Xem nâng cao
            </Button>
          </div>
        }
        description={data.description}
        icon={data.icon}
        title={data.title}
      />
      <CardBody>
        {mode === "simple" ? (
          <DataTable
            caption={data.caption}
            columns={simpleColumns}
            getRowKey={(row) => row.ticker}
            rows={data.simpleRows}
          />
        ) : (
          <DataTable
            caption={data.caption}
            columns={advancedColumns}
            getRowKey={(row) => row.criterion}
            rows={data.advancedRows}
          />
        )}
      </CardBody>
    </Card>
  );
}
