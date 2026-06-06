"use client";

import { useState } from "react";
import { Button, Chip } from "@/components/ui";
import type { DetailSectionData } from "../types";

type DetailToggleCardProps = {
  details: string[];
  labels: DetailSectionData;
};

export function DetailToggleCard({ details, labels }: DetailToggleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (details.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <Button
        size="sm"
        variant={isOpen ? "secondary" : "ghost"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? labels.collapseButtonLabel : labels.detailButtonLabel}
      </Button>

      {isOpen ? (
        <div className="mt-3 space-y-2">
          {details.map((detail) => (
            <div key={detail} className="flex gap-2 text-xs leading-5 text-muted">
              <Chip size="sm" variant="neutral">{labels.detailChipLabel}</Chip>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
