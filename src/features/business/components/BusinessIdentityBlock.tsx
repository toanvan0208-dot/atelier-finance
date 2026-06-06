"use client";

import { useState } from "react";
import { BusinessSectionCard } from "./BusinessSectionCard";
import { BusinessFieldGrid } from "./BusinessFieldGrid";
import { AiExplanationBox } from "./AiExplanationBox";
import type { BusinessIdentityData, BusinessSectionLabels } from "../types";

type BusinessIdentityBlockProps = {
  data: BusinessIdentityData;
  labels: BusinessSectionLabels;
};

export function BusinessIdentityBlock({ data, labels }: BusinessIdentityBlockProps) {
  const [note, setNote] = useState("");

  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <BusinessFieldGrid items={data.fields} />
        <AiExplanationBox data={data.ai} fallbackTitle={labels.aiTitle} />
        <div>
          <label className="text-xs font-bold text-ink" htmlFor="business-identity-note">
            {data.promptLabel}
          </label>
          <textarea
            id="business-identity-note"
            className="mt-2 min-h-24 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:bg-accent-soft"
            placeholder={data.placeholder}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>
    </BusinessSectionCard>
  );
}
