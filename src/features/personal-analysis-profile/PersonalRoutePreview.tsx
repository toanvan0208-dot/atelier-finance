"use client";

import { Chip } from "@/components/ui";
import {
  coreAnalysisRoute,
  goalOptions,
  getOptionLabel,
  interfaceModeOptions,
  knowledgeLevelOptions,
  riskAppetiteOptions,
} from "./profileOptions";
import type { PersonalAnalysisProfile } from "./types";

function getRouteMessage(profile: PersonalAnalysisProfile) {
  if (profile.knowledgeLevel === "beginner" && profile.goal === "learn") {
    return "Lộ trình đầy đủ được khuyến nghị.";
  }

  if (profile.interfaceMode === "dashboard") {
    return "Bạn vẫn đi theo lộ trình đầy đủ, nhưng mỗi module sẽ ưu tiên dashboard tóm tắt trước.";
  }

  if (profile.riskAppetite === "conservative") {
    return "Các bước Rủi ro, Minh bạch, Dòng tiền và Biên an toàn sẽ được làm nổi bật hơn.";
  }

  if (profile.goal === "track_one_stock") {
    return "Lộ trình ưu tiên kiểm tra một mã theo dashboard, cảnh báo thay đổi và checklist cuối.";
  }

  return "Lộ trình đầy đủ giúp bạn không bỏ qua BCTC, Định giá và Rủi ro.";
}

export function PersonalRoutePreview({ profile }: { profile: PersonalAnalysisProfile }) {
  return (
    <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-brand text-sm font-bold text-ink">Lộ trình phân tích cá nhân</h3>
        <Chip size="sm" variant="accent">
          {getOptionLabel(goalOptions, profile.goal)}
        </Chip>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{getRouteMessage(profile)}</p>
      <div className="mt-3 space-y-2">
        {coreAnalysisRoute.map((step, index) => {
          const isRiskStep =
            profile.riskAppetite === "conservative" &&
            ["Báo cáo tài chính", "Định giá", "Rủi ro & minh bạch"].includes(step);

          return (
            <div key={step} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface font-mono text-[10px] font-bold text-ink">
                {index + 1}
              </span>
              <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{step}</p>
                  {isRiskStep ? <Chip size="sm" variant="warning">Ưu tiên kiểm tra</Chip> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
        Lộ trình rút gọn chỉ phù hợp để xem nhanh, không thay thế phân tích đầy đủ.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip size="sm" variant="neutral">{getOptionLabel(knowledgeLevelOptions, profile.knowledgeLevel)}</Chip>
        <Chip size="sm" variant="neutral">{getOptionLabel(interfaceModeOptions, profile.interfaceMode)}</Chip>
        <Chip size="sm" variant="neutral">{getOptionLabel(riskAppetiteOptions, profile.riskAppetite)}</Chip>
      </div>
    </section>
  );
}
