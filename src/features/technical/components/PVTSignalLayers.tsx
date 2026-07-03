"use client";

import { useState } from "react";
import { Chip } from "@/components/ui";
import type { PVTSignalLayer, PVTSignalLayerId } from "../types";

type PVTSignalLayersProps = {
  layers: PVTSignalLayer[];
};

export function PVTSignalLayers({ layers }: PVTSignalLayersProps) {
  const [activeLayerId, setActiveLayerId] = useState<PVTSignalLayerId>(layers[0]?.id ?? "price");
  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

  if (!activeLayer) return null;

  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Lộ trình đọc PVT</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Đọc quan sát PVT theo 5 lớp</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Đi lần lượt từ giá, thanh khoản, thời điểm, so sánh rồi sự kiện để tránh nhìn chart tùy hứng.
        </p>
      </header>

      <div>
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-2 min-[1500px]:grid-cols-5">
            {layers.map((layer, index) => (
              <button
                key={layer.id}
                className={[
                  "group flex items-center gap-3 rounded-[8px] border px-3 py-3 text-left transition",
                  layer.id === activeLayer.id
                    ? "border-slate-950 bg-white shadow-[4px_4px_0_#0f172a]"
                    : "border-slate-200 bg-white hover:border-slate-400",
                ].join(" ")}
                type="button"
                onClick={() => setActiveLayerId(layer.id)}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                    layer.id === activeLayer.id ? "bg-amber-300 text-slate-950" : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-950">{layer.shortTitle}</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{layer.question}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-[8px] border border-slate-200 bg-white p-5">
            <Chip size="sm" variant="accent">{activeLayer.title}</Chip>
            <h3 className="mt-4 text-lg font-black text-slate-950">{activeLayer.question}</h3>
            <p className="mt-3 text-base font-bold leading-7 text-slate-950">{activeLayer.conclusion}</p>
            <div className="mt-5 grid gap-2">
              {activeLayer.evidence.map((item) => (
                <div key={item} className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[8px] border border-amber-300 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Điểm dễ đọc sai</p>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">{activeLayer.commonMistake}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
