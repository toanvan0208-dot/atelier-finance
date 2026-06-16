"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ScreeningFunnelSummaryData, ScreeningMode } from "../types";

type ScreeningFunnelSummaryProps = {
  data: ScreeningFunnelSummaryData;
  mode: ScreeningMode;
};

const gates = [
  { title: "Bối cảnh ngành", before: 128, after: 42, status: "Đạt sơ bộ", detail: "Kiểm tra ngành có đủ câu chuyện và dữ liệu nền để đi tiếp hay không." },
  { title: "Dễ hiểu DN", before: 42, after: 18, status: "Đạt sơ bộ", detail: "Ưu tiên doanh nghiệp có mô hình kinh doanh người mới có thể giải thích lại." },
  { title: "Tài chính sơ bộ", before: 18, after: 9, status: "Cần kiểm tra", detail: "Loại các cờ đỏ lớn về lỗ kéo dài, CFO âm, nợ cao hoặc tồn kho bất thường." },
  { title: "Định giá sơ bộ", before: 9, after: 6, status: "Cần kiểm tra", detail: "Chỉ kiểm tra định giá có quá lệch so với câu chuyện và ngành hay không." },
  { title: "Thanh khoản", before: 6, after: 4, status: "Đạt sơ bộ", detail: "Ưu tiên mã có thanh khoản đủ để người mới theo dõi và thoát vị thế khi cần." },
];

export function ScreeningFunnelSummary({ data, mode }: ScreeningFunnelSummaryProps) {
  const [openGate, setOpenGate] = useState<(typeof gates)[number] | null>(null);
  const isTicker = mode === "ticker";

  return (
    <Card className="bg-surface-soft">
      <CardHeader
        icon="5"
        title={isTicker ? data.tickerTitle : "Funnel lọc gọn"}
        description={isTicker ? data.tickerText : "5 cửa sơ lọc, chỉ hiển thị số trước/sau và ý nghĩa chính."}
      />
      <CardBody className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gates.map((gate, index) => {
            const ratio = Math.round((gate.after / gate.before) * 100);

            return (
              <button
                key={gate.title}
                type="button"
                onClick={() => setOpenGate(gate)}
                className="min-w-[176px] rounded-[4px] border border-border-soft bg-surface px-3 py-3 text-left transition hover:border-border"
              >
                <p className="font-mono text-[11px] font-bold text-subtle">Cửa {index + 1}</p>
                <p className="mt-1 text-sm font-bold text-ink">{gate.title}</p>
                <p className="mt-2 text-lg font-bold text-ink">{gate.before} → {gate.after}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">Giữ lại {ratio}%</span>
                  <Chip size="sm" variant={gate.status.includes("Đạt") ? "success" : "warning"}>{gate.status}</Chip>
                </div>
              </button>
            );
          })}
        </div>
        <p className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs font-semibold leading-5 text-muted">
          Kết quả lọc chỉ tạo danh sách ứng viên cần kiểm tra thêm.
        </p>

        {openGate ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
            role="dialog"
            onClick={() => setOpenGate(null)}
          >
            <div
              className="w-full max-w-[640px] rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-border-soft bg-surface-soft px-4 py-4">
                <div>
                  <Chip variant="accent">Funnel</Chip>
                  <h3 className="mt-2 text-lg font-bold text-ink">{openGate.title}</h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setOpenGate(null)}>Đóng</Button>
              </div>
              <div className="space-y-3 px-4 py-4">
                <p className="text-sm leading-6 text-muted">{openGate.detail}</p>
                <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                  Cửa này không kết luận mã đủ điều kiện hành động. Nó chỉ quyết định mã có nên đi tiếp sang bước kiểm chứng sâu hơn hay không.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
