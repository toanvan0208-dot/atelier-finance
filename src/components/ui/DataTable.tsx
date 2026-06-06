import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  caption?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
};

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DataTable<T>({
  caption,
  columns,
  emptyDescription,
  emptyTitle = "Không có dữ liệu",
  getRowKey,
  rows,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="overflow-x-auto rounded-[4px] border border-border-soft bg-surface">
      <table className="min-w-full border-collapse bg-surface text-xs">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-neutral text-[11px] uppercase tracking-[0.03em] text-ink">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "border-b border-border-soft px-3 py-2 font-bold",
                  alignClasses[column.align ?? "left"],
                  column.className
                )}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)} className="hover:bg-surface-soft">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "border-b border-border-soft px-3 py-2.5 text-muted last:border-b-0",
                    alignClasses[column.align ?? "left"],
                    column.className
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
