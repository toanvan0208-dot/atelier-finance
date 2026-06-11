import { Button, Chip } from "@/components/ui";
import type { PVTCompactData, SimulationPvtInterpretation } from "../types";

type SimulationPvtSnapshotProps = {
  data: PVTCompactData;
  interpretation: SimulationPvtInterpretation;
  onChange: (value: SimulationPvtInterpretation) => void;
};

const options: SimulationPvtInterpretation[] = [
  "Biến động chưa ảnh hưởng thesis",
  "Biến động xác nhận thesis",
  "Biến động làm thesis yếu đi",
  "Cần kiểm tra thêm ở PVT",
  "Cần kiểm tra thêm ở Tin tức/Rủi ro",
];

export function SimulationPvtSnapshot({ data, interpretation, onChange }: SimulationPvtSnapshotProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-ink">Biến động gần đây có làm đổi thesis không?</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          PVT trong mô phỏng chỉ giúp đọc ý nghĩa biến động, không thay thế phân tích thesis.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {data.toggles.map((toggle) => (
              <Chip key={toggle}>{toggle}</Chip>
            ))}
          </div>
          <div className="grid min-h-[220px] place-items-center rounded-[4px] border border-border-soft bg-surface px-4 py-6 text-center">
            <div>
              <p className="font-mono text-2xl font-bold text-ink">PVT</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Mock chart: giá, volume, VN-Index, ngành và mốc sự kiện.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.cards.map((card) => (
              <div key={card.label} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-semibold text-subtle">{card.label}</p>
                <p className="mt-1 text-sm font-bold text-ink">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2">
            {data.questions.map((question) => (
              <p key={question} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                {question}
              </p>
            ))}
          </div>
          <div className="grid gap-2">
            {options.map((option) => (
              <Button key={option} size="sm" variant={interpretation === option ? "primary" : "secondary"} onClick={() => onChange(option)}>
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
