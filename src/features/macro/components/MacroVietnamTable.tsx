import type { DataTableColumn } from "@/components/ui";
import { DataTable } from "@/components/ui";
import type { MacroTableRow } from "../types";

type MacroVietnamTableProps = {
  rows: MacroTableRow[];
};

const columns: Array<DataTableColumn<MacroTableRow>> = [
  {
    key: "factor",
    header: "Yếu tố",
    cell: (row) => <span className="font-medium text-ink">{row.factor}</span>,
  },
  {
    key: "currentState",
    header: "Trạng thái hiện tại",
    cell: (row) => row.currentState,
  },
  {
    key: "watchPoint",
    header: "Cần quan sát",
    cell: (row) => row.watchPoint,
  },
];

export function MacroVietnamTable({ rows }: MacroVietnamTableProps) {
  return (
    <DataTable
      caption="Bảng yếu tố vĩ mô Việt Nam"
      columns={columns}
      getRowKey={(row) => row.factor}
      rows={rows}
    />
  );
}
