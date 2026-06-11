"use client";

import { useState } from "react";
import { Card, CardBody, Chip, DataTable, SectionHeader } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  ValuationGroup,
  ValuationInputRow,
  ValuationMethodLogicRow,
  ValuationMetricRow,
  ValuationScenarioRow,
  ValuationTrapRow,
  ValuationWorkbenchMethod,
} from "../types";

type ValuationGroupsProps = {
  groups: ValuationGroup[];
};

function TextList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item} size="sm" variant="neutral">
          {item}
        </Chip>
      ))}
    </div>
  );
}

function ScenarioRangeVisual({ rows }: { rows: ValuationScenarioRow[] }) {
  const values = rows.map((row) => Number(row.range.replace(/\D/g, "")) / 1000).filter(Number.isFinite);
  const min = Math.max(0, Math.min(...values) - 4);
  const max = Math.max(...values) + 4;
  const span = max - min;

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
      <p className="text-sm font-bold text-ink">Scenario range</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const value = Number(row.range.replace(/\D/g, "")) / 1000;
          const left = ((value - min) / span) * 100;

          return (
            <div key={row.scenario} className="grid gap-2 sm:grid-cols-[88px_minmax(0,1fr)_88px] sm:items-center">
              <Chip size="sm" variant={row.tone}>{row.scenario}</Chip>
              <div className="relative h-8 rounded-[3px] bg-surface-soft">
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-border-soft" />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-border bg-accent"
                  style={{ left: `${left}%` }}
                />
              </div>
              <p className="text-sm font-bold text-ink">{row.range}</p>
              <p className="text-xs leading-5 text-muted sm:col-span-3">{row.assumption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupContent({ group }: { group: ValuationGroup }) {
  const inputColumns: Array<DataTableColumn<ValuationInputRow>> = [
    { key: "data", header: "Dữ liệu", cell: (row) => <span className="font-medium text-ink">{row.data}</span> },
    { key: "status", header: "Trạng thái", cell: (row) => row.status },
    { key: "note", header: "Ghi chú", cell: (row) => row.note },
  ];
  const methodColumns: Array<DataTableColumn<ValuationMethodLogicRow>> = [
    { key: "businessType", header: "Loại doanh nghiệp", cell: (row) => <span className="font-medium text-ink">{row.businessType}</span> },
    { key: "mainMethod", header: "Phương pháp chính", cell: (row) => row.mainMethod },
    { key: "reason", header: "Lý do", cell: (row) => row.reason },
  ];
  const metricColumns: Array<DataTableColumn<ValuationMetricRow>> = [
    { key: "metric", header: "Chỉ số", cell: (row) => <span className="font-medium text-ink">{row.metric}</span> },
    { key: "current", header: "Hiện tại", cell: (row) => row.current },
    { key: "comparison", header: "So sánh", cell: (row) => row.comparison },
    { key: "reading", header: "Cách đọc", cell: (row) => row.reading },
  ];
  const workbenchColumns: Array<DataTableColumn<ValuationWorkbenchMethod>> = [
    { key: "method", header: "Phương pháp", cell: (row) => <span className="font-medium text-ink">{row.method}</span> },
    { key: "inputs", header: "Dữ liệu đầu vào", cell: (row) => row.inputs.join("; ") },
    { key: "formula", header: "Công thức đơn giản", cell: (row) => row.formula },
    { key: "range", header: "Vùng giá", cell: (row) => row.range },
    { key: "reliability", header: "Độ tin cậy", cell: (row) => row.reliability },
    { key: "failureMode", header: "Khi nào dễ sai", cell: (row) => row.failureMode },
  ];
  const trapColumns: Array<DataTableColumn<ValuationTrapRow>> = [
    { key: "trap", header: "Bẫy", cell: (row) => <span className="font-medium text-ink">{row.trap}</span> },
    { key: "meaning", header: "Ý nghĩa", cell: (row) => row.meaning },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-4">
        <p className="text-xs font-bold text-ink">Câu hỏi chính</p>
        <p className="mt-1 text-base font-bold leading-7 text-ink">{group.question}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{group.summary}</p>
      </div>

      {group.inputRows ? (
        <DataTable caption={group.label} columns={inputColumns} getRowKey={(row) => row.data} rows={group.inputRows} />
      ) : null}
      {group.methodRows ? (
        <DataTable caption={group.label} columns={methodColumns} getRowKey={(row) => row.businessType} rows={group.methodRows} />
      ) : null}
      {group.metricRows ? (
        <DataTable caption={group.label} columns={metricColumns} getRowKey={(row) => row.metric} rows={group.metricRows} />
      ) : null}
      {group.workbenchMethods ? (
        <DataTable caption={group.label} columns={workbenchColumns} getRowKey={(row) => row.method} rows={group.workbenchMethods} />
      ) : null}
      {group.scenarioRows ? (
        <ScenarioRangeVisual rows={group.scenarioRows} />
      ) : null}
      {group.reliabilityRows ? (
        <DataTable
          caption={`${group.label} - độ tin cậy`}
          columns={[
            { key: "method", header: "Phương pháp", cell: (row) => <span className="font-medium text-ink">{row.method}</span> },
            { key: "reliability", header: "Độ tin cậy", cell: (row) => row.reliability },
            { key: "reason", header: "Lý do", cell: (row) => row.reason },
          ]}
          getRowKey={(row) => row.method}
          rows={group.reliabilityRows}
        />
      ) : null}

      {group.catalysts ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="mb-2 text-sm font-bold text-ink">Catalyst</p>
            <TextList items={group.catalysts} />
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="mb-2 text-sm font-bold text-ink">Risk</p>
            <TextList items={group.risks ?? []} />
          </div>
        </div>
      ) : null}
      {group.traps ? (
        <DataTable caption={`${group.label} - bẫy định giá`} columns={trapColumns} getRowKey={(row) => row.trap} rows={group.traps} />
      ) : null}
      {group.prompts ? (
        <div className="grid gap-2 md:grid-cols-2">
          {group.prompts.map((prompt) => (
            <label key={prompt} className="grid gap-2 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <span className="text-xs font-bold text-ink">{prompt}</span>
              <textarea className="min-h-16 rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-border" />
            </label>
          ))}
        </div>
      ) : null}

      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-subtle">
          Output của cụm
        </p>
        <p className="mt-1 text-sm font-bold leading-6 text-ink">{group.output}</p>
      </div>
    </div>
  );
}

export function ValuationGroups({ groups }: ValuationGroupsProps) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];

  return (
    <section>
      <SectionHeader
        description="Giao diện chính dùng 6 cụm lớn. Các bước con nằm bên trong từng cụm để tránh lộ trình dài và lỗi nhảy số."
        icon="6"
        title="6 cụm định giá lớn"
      />
      <Card>
        <CardBody className="space-y-5">
          <div
            className="flex items-center gap-2 overflow-x-auto border-b border-border-soft pb-3"
            role="tablist"
            aria-label="Flow các cụm định giá"
          >
            {groups.map((group, index) => {
              const isActive = group.id === activeGroup.id;

              return (
                <div key={group.id} className="flex shrink-0 items-center gap-2">
                  <button
                    className={[
                      "min-h-9 rounded-[3px] border-[1.5px] px-3 text-xs font-bold transition",
                      isActive
                        ? "border-border bg-accent-soft text-accent shadow-hard-sm"
                        : "border-border-soft bg-surface text-muted hover:border-border hover:bg-surface-hover hover:text-ink",
                    ].join(" ")}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGroupId(group.id)}
                  >
                    {group.label}
                  </button>
                  {index < groups.length - 1 ? (
                    <span className="font-mono text-xs font-bold text-subtle" aria-hidden="true">
                      -&gt;
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div role="tabpanel">
            <GroupContent group={activeGroup} />
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
