"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type { BusinessBctcBridgeData, BusinessBctcBridgeItem } from "../types";

type BusinessBctcBridgeProps = {
  data: BusinessBctcBridgeData;
  canGoToFinancials: boolean;
  onNavigate?: (moduleKey: string) => void;
};

export function BusinessBctcBridge({
  canGoToFinancials,
  data,
  onNavigate,
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
          description="BCTC dùng để kiểm chứng giả thuyết kinh doanh, không chỉ để nhìn số đẹp hay xấu."
          icon="B"
          title="Dữ liệu cần mang sang BCTC"
        />
      </button>

      {isOpen ? (
        <CardBody className="space-y-4">
          <DataTable
            caption="Dữ liệu cần mang sang BCTC"
            columns={columns}
            getRowKey={(row) => row.question}
            rows={data.items}
          />
          <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs font-semibold leading-5 text-ink">
            Nếu nút BCTC đang khóa, hãy hoàn thành mini check để đảm bảo bạn hiểu doanh nghiệp kiếm tiền từ đâu trước khi đọc số.
          </p>
          <Button
            disabled={!canGoToFinancials}
            onClick={() => onNavigate?.("financials")}
            variant={canGoToFinancials ? "primary" : "secondary"}
          >
            {canGoToFinancials ? data.ctaLabel : data.disabledCtaLabel}
          </Button>
        </CardBody>
      ) : null}
    </Card>
  );
}
