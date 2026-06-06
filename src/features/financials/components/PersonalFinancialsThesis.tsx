"use client";

import { useState } from "react";
import { Chip } from "@/components/ui";
import type { PersonalFinancialsThesisData } from "../types";
import { FinancialsSectionCard } from "./FinancialsSectionCard";

type PersonalFinancialsThesisProps = {
  data: PersonalFinancialsThesisData;
};

export function PersonalFinancialsThesis({ data }: PersonalFinancialsThesisProps) {
  const [value, setValue] = useState("");

  return (
    <FinancialsSectionCard description={data.description} icon={data.icon} title={data.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.prompts.map((prompt) => (
            <Chip key={prompt} variant="neutral">{prompt}</Chip>
          ))}
        </div>
        <textarea
          className="min-h-36 w-full resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:bg-accent-soft"
          placeholder={data.placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </FinancialsSectionCard>
  );
}
