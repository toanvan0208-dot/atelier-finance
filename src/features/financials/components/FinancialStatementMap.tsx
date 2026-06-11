"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { FinancialStatementMapData } from "../types";

type FinancialStatementMapProps = {
  data: FinancialStatementMapData;
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-subtle" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h12m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function scrollToBlock(id?: string) {
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function FinancialStatementMap({ data }: FinancialStatementMapProps) {
  const [openGuide, setOpenGuide] = useState(false);

  return (
    <section>
      <Card className="border-border-soft">
        <CardHeader
          action={<Button size="sm" variant="secondary" onClick={() => setOpenGuide(true)}>Cách đọc</Button>}
          description={data.description}
          icon="3"
          title={data.title}
        />
        <CardBody>
          <div className="flex gap-3 overflow-x-auto pb-2 lg:items-stretch lg:overflow-visible">
            {data.items.map((item, index) => (
              <div key={item.id} className="flex min-w-[220px] flex-1 items-stretch gap-3">
                <div className="flex w-full flex-col rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{item.mainQuestion}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.keyLines.map((line) => <Chip key={line} size="sm" variant="neutral">{line}</Chip>)}
                  </div>
                  <Button className="mt-auto pt-3" size="sm" variant="ghost" onClick={() => scrollToBlock(item.targetBlockId)}>Đọc phần này</Button>
                </div>
                {index < data.items.length - 1 ? <div className="hidden items-center lg:flex"><ArrowIcon /></div> : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[4px] border border-border bg-surface px-3 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ink">{data.qualityNode.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{data.qualityNode.mainQuestion}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.qualityNode.keyLines.map((line) => <Chip key={line} size="sm" variant="warning">{line}</Chip>)}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => scrollToBlock(data.qualityNode.targetBlockId)}>Đọc phần này</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {openGuide ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5" role="dialog" aria-modal="true" onClick={() => setOpenGuide(false)}>
          <div className="max-h-[92dvh] w-full max-w-[680px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-lg font-bold text-ink">Cách đọc 3 báo cáo tài chính</h3>
              <Button size="sm" variant="ghost" onClick={() => setOpenGuide(false)}>Đóng</Button>
            </div>
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <p className="text-sm leading-6 text-muted">Kết quả kinh doanh cho biết doanh nghiệp tạo lợi nhuận ra sao, nhưng chưa trả lời tiền thật đã về hay chưa.</p>
              <p className="text-sm leading-6 text-muted">Bảng cân đối cho biết lợi nhuận và vốn đang nằm ở tiền, tồn kho, khoản phải thu, tài sản hay nợ.</p>
              <p className="text-sm leading-6 text-muted">Lưu chuyển tiền tệ kiểm tra lợi nhuận kế toán có chuyển thành dòng tiền kinh doanh thật không.</p>
              <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-xs leading-5 text-ink">
                Người mới không nên đọc từng báo cáo tách rời. Hãy nối chúng qua câu hỏi: lợi nhuận có tạo ra tiền và có làm bảng cân đối khỏe hơn không?
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
