import { Button, Chip } from "@/components/ui";
import type { PVTFinalConclusionData, PVTNextAction } from "../types";

type PVTFinalConclusionProps = {
  conclusion: PVTFinalConclusionData;
  actions: PVTNextAction[];
  onNavigate: (key: string) => void;
};

export function PVTFinalConclusion({
  actions,
  conclusion,
  onNavigate,
}: PVTFinalConclusionProps) {
  const rows = [
    { label: "Trạng thái hiện tại", value: conclusion.status },
    { label: "Điểm tích cực", value: conclusion.positive },
    { label: "Điểm cần thận trọng", value: conclusion.caution },
    { label: "Bước tiếp theo", value: conclusion.nextStep },
  ];

  return (
    <section className="overflow-hidden rounded-[8px] border-[1.5px] border-slate-950 bg-white shadow-[5px_5px_0_rgb(15_23_42_/_0.24)]">
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Tóm tắt PVT cuối module</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Chọn bước tiếp theo để kiểm tra bối cảnh, không biến quan sát giá thành kết luận hành động.
            </p>
          </div>
          <Chip variant="accent">Tổng hợp</Chip>
        </div>
      </header>
      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.04em] text-slate-500">{row.label}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-950">{row.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          {actions.slice(0, 4).map((action) => (
            <Button
              key={action.label}
              data-module-key={action.moduleKey}
              data-testid="module-cta"
              variant={action.primary ? "primary" : "secondary"}
              onClick={() => onNavigate(action.moduleKey)}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
          Dữ liệu giá và thanh khoản chỉ phục vụ quan sát thị trường. Người dùng cần tự kiểm tra thêm mô hình kinh doanh, báo cáo tài chính, định giá và rủi ro.
        </div>
      </div>
    </section>
  );
}
