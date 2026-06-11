import { Button } from "@/components/ui";
import type { ReflectionState } from "../types";

type SimulationReflectionBoxProps = {
  value: ReflectionState;
  onChange: (value: ReflectionState) => void;
};

const fields: Array<{
  key: keyof Omit<ReflectionState, "completed">;
  label: string;
  placeholder: string;
}> = [
  { key: "initialThought", label: "Tôi đã nghĩ gì khi tạo mô phỏng?", placeholder: "Ghi lại lý do và cảm xúc ban đầu." },
  { key: "supportingData", label: "Dữ liệu nào ủng hộ thesis?", placeholder: "Doanh thu, biên lợi nhuận, dòng tiền, PVT..." },
  { key: "weakeningData", label: "Dữ liệu nào làm thesis yếu đi?", placeholder: "Điểm trái chiều hoặc dữ liệu chưa khớp." },
  { key: "emotionCheck", label: "Tôi có phản ứng vì cảm xúc không?", placeholder: "FOMO, hoảng loạn, tin đồn, nhóm chat..." },
  { key: "processLesson", label: "Tôi đúng/sai vì quy trình hay vì may mắn?", placeholder: "Tập trung vào quy trình, không phán xét kết quả quá sớm." },
  { key: "nextCheck", label: "Lần sau cần kiểm tra gì kỹ hơn?", placeholder: "Module hoặc dữ liệu cần quay lại." },
];

export function SimulationReflectionBox({ value, onChange }: SimulationReflectionBoxProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-ink">Nhật ký và hậu kiểm</h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          Ghi lại dữ liệu, cảm xúc và bài học để mô phỏng trở thành bài tập quy trình.
        </p>
      </div>
      <div className="grid gap-3">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-bold text-ink">{field.label}</span>
            <textarea
              className="min-h-[72px] resize-y rounded-[4px] border-[1.5px] border-border-soft bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-border"
              value={value[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onChange({ ...value, completed: true })}>Ghi vào nhật ký</Button>
        <Button variant="secondary">Xem nhật ký mô phỏng</Button>
        <Button variant="ghost">Đặt mốc xem lại tiếp theo</Button>
      </div>
    </section>
  );
}
