import { DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { GovernanceData } from "../types";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { DetailToggleCard } from "./DetailToggleCard";

type GovernanceBlockProps = {
  data: GovernanceData;
};

export function GovernanceBlock({ data }: GovernanceBlockProps) {
  const columns: Array<DataTableColumn<GovernanceData["fields"][number]>> = [
    {
      key: "label",
      header: data.columns.label,
      cell: (row) => <span className="font-medium text-ink">{row.label}</span>,
    },
    {
      key: "value",
      header: data.columns.value,
      cell: (row) => row.value,
    },
  ];

  return (
    <BusinessSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <DataTable
          caption={data.tableCaption}
          columns={columns}
          getRowKey={(row) => row.label}
          rows={data.fields}
        />
        <div className="rounded-[4px] border-[1.5px] border-border bg-warning/25 px-3 py-3">
          <p className="text-sm font-bold text-ink">{data.warningTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{data.warning}</p>
        </div>
        <DetailToggleCard details={data.details} labels={data.detailLabels} />
      </div>
    </BusinessSectionCard>
  );
}
