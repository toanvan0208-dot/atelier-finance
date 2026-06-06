"use client";

import { useState } from "react";
import type { DataTableColumn } from "@/components/ui";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  SectionHeader,
} from "@/components/ui";
import type {
  DeepDiveSection,
  DeepDiveTableRow,
  IndustryDeepDiveData,
} from "../types";

type IndustryDeepDiveProps = {
  data: IndustryDeepDiveData;
};

function DeepDiveDataTable({ data }: IndustryDeepDiveProps) {
  const columns: Array<DataTableColumn<DeepDiveTableRow>> = [
    {
      key: "category",
      header: data.dataTable.columns.category,
      cell: (row) => <span className="font-medium text-ink">{row.category}</span>,
    },
    {
      key: "dataPoint",
      header: data.dataTable.columns.dataPoint,
      cell: (row) => row.dataPoint,
    },
    {
      key: "whyItMatters",
      header: data.dataTable.columns.whyItMatters,
      cell: (row) => row.whyItMatters,
    },
  ];

  return (
    <Card>
      <CardHeader
        icon={data.dataTable.icon}
        title={data.dataTable.title}
      />
      <CardBody>
        <DataTable
          caption={data.dataTable.title}
          columns={columns}
          getRowKey={(row) => `${row.category}-${row.dataPoint}`}
          rows={data.dataTable.rows}
        />
      </CardBody>
    </Card>
  );
}

function DeepDiveSectionCard({ section }: { section: DeepDiveSection }) {
  return (
    <Card>
      <CardHeader title={section.title} />
      <CardBody>
        {section.description ? (
          <p className="mb-3 text-xs leading-5 text-subtle">
            {section.description}
          </p>
        ) : null}
        <ul className="space-y-2 text-xs leading-5 text-muted">
          {section.items.map((item) => (
            <li
              key={item}
              className="rounded-md bg-surface-soft px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function IndustryDeepDive({ data }: IndustryDeepDiveProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader icon={data.icon} title={data.title} />
        <Button
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          variant="secondary"
        >
          {data.triggerLabel}
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.sections.map((section) => (
              <DeepDiveSectionCard key={section.id} section={section} />
            ))}
          </div>

          <DeepDiveDataTable data={data} />
        </div>
      ) : null}
    </section>
  );
}
