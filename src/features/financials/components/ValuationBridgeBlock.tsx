import { DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { ValuationBridgeData, ValuationBridgeItem } from "../types";
import { DetailToggleCard } from "./DetailToggleCard";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type ValuationBridgeBlockProps = {
  data: ValuationBridgeData;
};

export function ValuationBridgeBlock({ data }: ValuationBridgeBlockProps) {
  const columns: Array<DataTableColumn<ValuationBridgeItem>> = [
    {
      key: "source",
      header: data.columns.source,
      cell: (row) => <span className="font-medium text-ink">{row.source}</span>,
    },
    {
      key: "usage",
      header: data.columns.usage,
      cell: (row) => row.usage,
    },
  ];

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <DataTable
          caption={data.tableCaption}
          columns={columns}
          getRowKey={(row) => row.source}
          rows={data.rows}
        />
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </FinancialsSectionCard>
  );
}
