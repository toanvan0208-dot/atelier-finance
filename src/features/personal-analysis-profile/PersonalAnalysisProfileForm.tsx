"use client";

import type { PersonalAnalysisProfile, ProfileOption } from "./types";
import {
  explanationDepthOptions,
  goalOptions,
  interfaceModeOptions,
  knowledgeLevelOptions,
  riskAppetiteOptions,
} from "./profileOptions";
import { cn } from "@/lib/cn";

type PersonalAnalysisProfileFormProps = {
  draft: PersonalAnalysisProfile;
  onChange: (profile: PersonalAnalysisProfile) => void;
};

function OptionGroup<T extends string>({
  columns = "two",
  description,
  label,
  onChange,
  options,
  value,
}: {
  columns?: "one" | "two";
  description: string;
  label: string;
  onChange: (value: T) => void;
  options: Array<ProfileOption<T>>;
  value: T;
}) {
  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="font-brand text-sm font-bold text-ink">{label}</legend>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      <div className={cn("grid gap-2", columns === "two" && "sm:grid-cols-2")}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 transition",
                "hover:border-border hover:bg-accent-soft",
                isSelected && "border-border bg-accent-soft shadow-hard-sm"
              )}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name={label}
                type="radio"
                value={option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="text-sm font-bold leading-5 text-ink">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{option.description}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PersonalAnalysisProfileForm({
  draft,
  onChange,
}: PersonalAnalysisProfileFormProps) {
  return (
    <div className="space-y-6">
      <OptionGroup
        description="Mức này giúp hệ thống quyết định nên giải thích nhiều hay ít."
        label="Mức hiểu biết tài chính của bạn"
        onChange={(knowledgeLevel) => onChange({ ...draft, knowledgeLevel })}
        options={knowledgeLevelOptions}
        value={draft.knowledgeLevel}
      />
      <OptionGroup
        description="Mục tiêu này giúp hệ thống đề xuất lộ trình phù hợp."
        label="Bạn dùng hệ thống để làm gì?"
        onChange={(goal) => onChange({ ...draft, goal })}
        options={goalOptions}
        value={draft.goal}
      />
      <OptionGroup
        description="Không dùng để tạo tín hiệu giao dịch. Chỉ dùng để điều chỉnh mức cảnh báo và thứ tự ưu tiên kiểm tra."
        label="Khẩu vị rủi ro"
        onChange={(riskAppetite) => onChange({ ...draft, riskAppetite })}
        options={riskAppetiteOptions}
        value={draft.riskAppetite}
      />
      <OptionGroup
        description="Bạn có thể đổi lại bất kỳ lúc nào."
        label="Bạn muốn xem giao diện theo kiểu nào?"
        onChange={(interfaceMode) => onChange({ ...draft, interfaceMode })}
        options={interfaceModeOptions}
        value={draft.interfaceMode}
      />
      <OptionGroup
        columns="one"
        description="Tùy chọn này quyết định mức độ hệ thống giải thích thuật ngữ, chỉ số và cảnh báo."
        label="Độ sâu giải thích"
        onChange={(explanationDepth) => onChange({ ...draft, explanationDepth })}
        options={explanationDepthOptions}
        value={draft.explanationDepth}
      />
    </div>
  );
}
