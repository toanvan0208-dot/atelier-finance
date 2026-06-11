import type { SimulationThesisFormState } from "../types";

type SimulationThesisFormProps = {
  value: SimulationThesisFormState;
  onChange: (value: SimulationThesisFormState) => void;
};

const fields: Array<{
  key: keyof SimulationThesisFormState;
  label: string;
  placeholder: string;
  rows?: number;
}> = [
  {
    key: "mainThesis",
    label: "Luận điểm chính của mô phỏng",
    placeholder: "PNJ có thể phục hồi biên lợi nhuận nếu sức mua bán lẻ cải thiện...",
    rows: 3,
  },
  {
    key: "whyFollow",
    label: "Vì sao cổ phiếu này đáng theo dõi",
    placeholder: "Theo dõi sự phục hồi sức mua, biên gộp và dòng tiền.",
  },
  {
    key: "confirmingData",
    label: "Dữ liệu đang ủng hộ thesis",
    placeholder: "Doanh thu bán lẻ hồi phục, biên lợi nhuận giữ ổn định...",
    rows: 3,
  },
  {
    key: "disconfirmingData",
    label: "Dữ liệu có thể phủ định thesis",
    placeholder: "Sức mua yếu hơn kỳ vọng, tồn kho tăng, biên lợi nhuận giảm...",
    rows: 3,
  },
  {
    key: "mainRisk",
    label: "Rủi ro lớn nhất",
    placeholder: "Sức mua yếu kéo dài hoặc chi phí đầu vào tăng.",
  },
  {
    key: "weakenCondition",
    label: "Điều kiện khiến thesis yếu đi",
    placeholder: "BCTC mới cho thấy biên gộp giảm và CFO xấu đi.",
  },
  {
    key: "reviewDate",
    label: "Mốc thời gian cần xem lại",
    placeholder: "Sau BCTC quý tiếp theo hoặc sau 1 tháng.",
  },
  {
    key: "moduleToRecheck",
    label: "Module cần quay lại nếu dữ liệu thay đổi",
    placeholder: "BCTC, Rủi ro, PVT hoặc Định giá.",
  },
];

export function SimulationThesisForm({ value, onChange }: SimulationThesisFormProps) {
  return (
    <div className="grid gap-3">
      {fields.map((field) => (
        <label key={field.key} className="grid gap-2">
          <span className="text-xs font-bold text-ink">{field.label}</span>
          <textarea
            className="min-h-[72px] resize-y rounded-[4px] border-[1.5px] border-border-soft bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-border"
            rows={field.rows ?? 2}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  );
}
