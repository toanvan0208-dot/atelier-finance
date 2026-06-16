"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { PVTSignalLayer, PVTSignalLayerId } from "../types";

type PVTSignalLayersProps = {
  layers: PVTSignalLayer[];
};

export function PVTSignalLayers({ layers }: PVTSignalLayersProps) {
  const [activeLayerId, setActiveLayerId] = useState<PVTSignalLayerId>(layers[0]?.id ?? "price");
  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

  if (!activeLayer) return null;

  return (
    <Card>
      <CardHeader
        title="Đọc quan sát PVT theo 5 lớp"
        description="Đọc theo thứ tự để tránh nhìn chart tùy hứng."
      />
      <CardBody className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          {layers.map((layer) => (
            <button
              key={layer.id}
              className={[
                "rounded-[4px] border px-3 py-3 text-left text-sm font-bold transition",
                layer.id === activeLayer.id
                  ? "border-border bg-accent-soft shadow-hard-sm"
                  : "border-border-soft bg-surface-soft hover:border-border",
              ].join(" ")}
              type="button"
              onClick={() => setActiveLayerId(layer.id)}
            >
              {layer.shortTitle}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <Chip size="sm" variant="accent">{activeLayer.title}</Chip>
            <p className="mt-3 text-sm font-bold text-ink">{activeLayer.question}</p>
            <p className="mt-3 text-base font-semibold leading-7 text-ink">{activeLayer.conclusion}</p>
            <div className="mt-4 grid gap-2">
              {activeLayer.evidence.map((item) => (
                <p key={item} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-[4px] border border-warning bg-warning/10 p-4">
            <p className="text-sm font-bold text-ink">Sai lầm phổ biến</p>
            <p className="mt-2 text-xs leading-5 text-muted">{activeLayer.commonMistake}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
