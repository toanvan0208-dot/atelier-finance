import { Chip } from "@/components/ui";
import type { PVTObservationData } from "../types";

type PVTConfirmationScenariosProps = {
  confirmation: string[];
  invalidation: string[];
  scenarios: PVTObservationData["scenarios"];
};

export function PVTConfirmationScenarios({
  confirmation,
  invalidation,
  scenarios,
}: PVTConfirmationScenariosProps) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.04em] text-amber-700">Kiểm tra tiếp theo</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Cần quan sát điều gì tiếp theo?</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Trước khi kết luận, hãy xác định điều gì sẽ củng cố hoặc làm yếu đi cách đọc hiện tại.
        </p>
      </header>
      <div className="grid gap-4 p-5 2xl:grid-cols-3">
        <ObservationList title="Điều kiện củng cố" items={confirmation} tone="success" indexLabel="A" />
        <ObservationList title="Điều kiện làm yếu" items={invalidation} tone="warning" indexLabel="B" />
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-950">Kịch bản quan sát</p>
            <Chip size="sm" variant="neutral">{scenarios.length} kịch bản</Chip>
          </div>
          <div className="mt-3 space-y-3">
            {scenarios.map((scenario) => (
              <div key={scenario.name} className="rounded-[8px] border border-slate-200 bg-white p-3">
                <Chip size="sm" variant="neutral">{scenario.name}</Chip>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-950">{scenario.condition}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{scenario.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ObservationList({
  indexLabel,
  items,
  title,
  tone,
}: {
  indexLabel: string;
  items: string[];
  title: string;
  tone: "success" | "warning";
}) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
            {indexLabel}
          </span>
          <p className="text-sm font-black text-slate-950">{title}</p>
        </div>
        <Chip size="sm" variant={tone}>{items.length} điểm</Chip>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
