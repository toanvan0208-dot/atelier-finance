"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { BusinessBctcBridgeData, BusinessBctcBridgeItem } from "../types";

type BusinessBctcBridgeProps = {
  data: BusinessBctcBridgeData;
  canGoToFinancials: boolean;
};

export function BusinessBctcBridge({
  canGoToFinancials,
  data,
}: BusinessBctcBridgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const columns: Array<DataTableColumn<BusinessBctcBridgeItem>> = [
    {
      key: "question",
      header: "Câu hỏi cần kiểm chứng",
      cell: (row) => <span className="font-medium text-ink">{row.question}</span>,
    },
    {
      key: "module",
      header: "Module đích",
      cell: (row) => (
        <Chip size="sm" variant="accent">
          {row.module}
        </Chip>
      ),
    },
    {
      key: "dataToCheck",
      header: "Dữ liệu cần xem",
      cell: (row) => row.dataToCheck.join(", "),
    },
  ];

  return (
    <Card>
      <button
        type="button"
        className="block w-full text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <CardHeader
          action={
            <span className="rounded-[3px] border border-border-soft bg-surface px-2 py-1 text-xs font-bold text-muted">
              {isOpen ? "Thu gọn" : "Xem chi tiết"}
            </span>
          }
          description={data.description}
          icon="B"
          title={data.title}
        />
      </button>

      {isOpen ? (
        <CardBody className="space-y-4">
          <DataTable
            caption={data.title}
            columns={columns}
            getRowKey={(row) => row.question}
            rows={data.items}
          />
          <Button disabled={!canGoToFinancials} variant={canGoToFinancials ? "primary" : "secondary"}>
            {canGoToFinancials ? data.ctaLabel : data.disabledCtaLabel}
          </Button>
        </CardBody>
      ) : null}
    </Card>
  );
}
