"use client";

import { Chip } from "@/components/ui";
import {
  explanationDepthOptions,
  getOptionLabel,
  goalOptions,
  interfaceModeOptions,
  knowledgeLevelOptions,
  riskAppetiteOptions,
} from "./profileOptions";
import type { PersonalAnalysisProfile } from "./types";

function getSummarySentence(profile: PersonalAnalysisProfile) {
  const parts: string[] = [];

  if (profile.knowledgeLevel === "beginner" || profile.explanationDepth === "detailed") {
    parts.push("giải thích dễ hiểu");
  }

  if (profile.riskAppetite === "conservative") {
    parts.push("cảnh báo rủi ro rõ hơn");
  }

  if (profile.interfaceMode === "guided") {
    parts.push("dẫn bạn đi theo lộ trình đầy đủ");
  }

  if (profile.interfaceMode === "dashboard") {
    parts.push("đưa dashboard tóm tắt lên trước");
  }

  if (parts.length === 0) {
    parts.push("giữ lộ trình phân tích đầy đủ với mức giải thích vừa đủ");
  }

  return `Hệ thống sẽ ưu tiên ${parts.join(", ")}.`;
}

export function ProfilePreferenceSummary({ profile }: { profile: PersonalAnalysisProfile }) {
  return (
    <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-brand text-sm font-bold text-ink">Hồ sơ hiện tại</h3>
        <Chip size="sm" variant="neutral">Local</Chip>
      </div>
      <dl className="mt-3 grid gap-2 text-xs leading-5">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Mức hiểu biết</dt>
          <dd className="text-right font-bold text-ink">{getOptionLabel(knowledgeLevelOptions, profile.knowledgeLevel)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Mục tiêu</dt>
          <dd className="text-right font-bold text-ink">{getOptionLabel(goalOptions, profile.goal)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Khẩu vị rủi ro</dt>
          <dd className="text-right font-bold text-ink">{getOptionLabel(riskAppetiteOptions, profile.riskAppetite)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Giao diện</dt>
          <dd className="text-right font-bold text-ink">{getOptionLabel(interfaceModeOptions, profile.interfaceMode)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted">Giải thích</dt>
          <dd className="text-right font-bold text-ink">{getOptionLabel(explanationDepthOptions, profile.explanationDepth)}</dd>
        </div>
      </dl>
      <p className="mt-3 rounded-[4px] border border-border-soft bg-accent-soft px-3 py-2 text-xs leading-5 text-muted">
        {getSummarySentence(profile)}
      </p>
    </section>
  );
}
