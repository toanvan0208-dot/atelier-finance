import type { DataTableColumn } from "@/components/ui";
import { Card, CardBody, CardHeader, Chip, DataTable } from "@/components/ui";
import type { RepresentativeStock, RepresentativeStocksData } from "../types";

type RepresentativeStocksProps = {
  data: RepresentativeStocksData;
};

export function RepresentativeStocks({ data }: RepresentativeStocksProps) {
  const columns: Array<DataTableColumn<RepresentativeStock>> = [
    {
      key: "ticker",
      header: data.columns.ticker,
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-ink">
          {row.ticker}
        </span>
      ),
    },
    {
      key: "category",
      header: data.columns.category,
      cell: (row) => <Chip size="sm">{row.category}</Chip>,
    },
    {
      key: "rationale",
      header: data.columns.rationale,
      cell: (row) => (
        <div>
          <p className="font-medium text-ink">{row.name}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{row.rationale}</p>
        </div>
      ),
    },
    {
      key: "riskNote",
      header: data.columns.riskNote,
      cell: (row) => row.riskNote,
    },
  ];

  return (
    <Card>
      <CardHeader icon={data.icon} title={data.title} />
      <CardBody>
        <DataTable
          caption={data.caption}
          columns={columns}
          getRowKey={(row) => row.id}
          rows={data.stocks}
        />
      </CardBody>
    </Card>
  );
}
