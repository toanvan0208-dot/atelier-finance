import { Chip, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { IncomeStatementData, StatementRow } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type IncomeStatementBlockProps = {
  data: IncomeStatementData;
};

export function IncomeStatementBlock({ data }: IncomeStatementBlockProps) {
  const columns: Array<DataTableColumn<StatementRow>> = [
    { key: "item", header: data.columns.item, cell: (row) => <span className="font-medium text-ink">{row.item}</span> },
    { key: "value", header: data.columns.value, cell: (row) => row.value },
    { key: "note", header: data.columns.note, cell: (row) => row.note },
  ];

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          {data.flow.map((step, index) => <Chip key={`${step}-${index}`} variant="neutral">{step}</Chip>)}
        </div>
        <DataTable
          caption={data.tableCaption}
          columns={columns}
          getRowKey={(row) => row.item}
          rows={data.rows}
        />
        <p className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2 text-sm leading-6 text-muted">
          {data.checkQuestion}
        </p>
      </div>
    </FinancialsSectionCard>
  );
}
