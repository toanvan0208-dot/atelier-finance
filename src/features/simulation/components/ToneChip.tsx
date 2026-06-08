import { Chip } from "@/components/ui";
import type { Tone } from "../types";

type ToneChipProps = {
  tone: Tone;
};

const toneLabels: Record<Tone, string> = {
  accent: "Điểm nhấn",
  danger: "Cần chú ý",
  neutral: "Trung tính",
  success: "Ổn",
  warning: "Xem lại",
};

export function ToneChip({ tone }: ToneChipProps) {
  return (
    <Chip size="sm" variant={tone}>
      {toneLabels[tone]}
    </Chip>
  );
}
