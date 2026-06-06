import { Card, CardBody, CardHeader, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { ScreeningComparisonData, ScreeningComparisonRow } from "../types";

type ScreeningComparisonTableProps = {
  data: ScreeningComparisonData;
};

export function ScreeningComparisonTable({ data }: ScreeningComparisonTableProps) {
  const columns: Array<DataTableColumn<ScreeningComparisonRow>> = [
    {
      key: "criterion",
      header: data.columns.criterion,
      cell: (row) => <span className="font-medium text-ink">{row.criterion}</span>,
    },
    {
      key: "stockA",
      header: data.columns.stockA,
      cell: (row) => row.stockA,
    },
    {
      key: "stockB",
      header: data.columns.stockB,
      cell: (row) => row.stockB,
    },
    {
      key: "stockC",
      header: data.columns.stockC,
      cell: (row) => row.stockC,
    },
  ];

  return (
    <Card>
      <CardHeader description={data.description} icon={data.icon} title={data.title} />
      <CardBody>
        <DataTable
          caption={data.caption}
          columns={columns}
          getRowKey={(row) => row.criterion}
          rows={data.rows}
        />
      </CardBody>
    </Card>
  );
}
