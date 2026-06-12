"use client";

import { macroCompassData } from "../data/macroCompass.data";
import {
  AffectedSectorsSection,
  EarlyWarningSection,
  MacroConclusionPanel,
  MacroCurrentPicture,
  MacroTransmissionSection,
  VietnamContextSection,
  WorldContextSection,
} from "./MacroCompassSections";

type MacroPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

export function MacroPage({ onNavigate }: MacroPageProps) {
  const data = macroCompassData;

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-7">
      <header className="rounded-[8px] border-[1.5px] border-border bg-surface p-5 shadow-soft">
        <h1 className="font-brand text-2xl font-bold text-ink sm:text-3xl">
          {data.header.title}
        </h1>
        <p className="mt-2 max-w-[780px] text-sm leading-7 text-muted">
          {data.header.description}
        </p>
        <p className="mt-4 rounded-[5px] border border-border-soft bg-accent-soft/60 px-4 py-3 text-sm font-semibold leading-6 text-ink">
          {data.header.question}
        </p>
      </header>

      <main className="space-y-8">
        <MacroCurrentPicture data={data.currentPicture} onNavigate={onNavigate} />
        <MacroTransmissionSection paths={data.transmissionPaths} terms={data.terms} />
        <WorldContextSection metrics={data.worldMetrics} />
        <VietnamContextSection metrics={data.vietnamMetrics} />
        <AffectedSectorsSection sectors={data.affectedSectors} onNavigate={onNavigate} />
        <EarlyWarningSection warnings={data.warnings} />
        <MacroConclusionPanel data={data.conclusion} onNavigate={onNavigate} />
      </main>
    </div>
  );
}
