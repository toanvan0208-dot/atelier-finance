"use client";

import { useState } from "react";
import { Chip, Tabs } from "@/components/ui";
import type { BusinessTypeData } from "../types";
import { BusinessSectionCard } from "./BusinessSectionCard";

type BusinessTypeTagsProps = {
  data: BusinessTypeData;
};

export function BusinessTypeTags({ data }: BusinessTypeTagsProps) {
  const activeDefault = data.tags.find((tag) => tag.isActive)?.value ?? data.tags[0]?.value;
  const [activeValue, setActiveValue] = useState(activeDefault);

  const tabs = data.tags.map((tag) => ({
    value: tag.value,
    label: tag.label,
    content: (
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
        <Chip variant={tag.isActive ? "accent" : "neutral"}>{tag.label}</Chip>
        <p className="mt-2 text-sm leading-6 text-muted">{tag.description}</p>
      </div>
    ),
  }));

  return (
    <BusinessSectionCard
      description={data.description}
      icon={data.icon}
      title={data.title}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <button
              key={tag.value}
              className="text-left"
              type="button"
              onClick={() => setActiveValue(tag.value)}
            >
              <Chip variant={tag.value === activeValue ? "accent" : "neutral"}>
                {tag.label}
              </Chip>
            </button>
          ))}
        </div>
        <Tabs
          ariaLabel={data.title}
          items={tabs}
          value={activeValue}
          onChange={setActiveValue}
        />
      </div>
    </BusinessSectionCard>
  );
}
