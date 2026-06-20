import type { ReactNode } from "react";
import { JourneyHeader } from "./JourneyHeader";
import type { JourneyHeaderData } from "./JourneyHeader";

type MainContentProps = {
  activeLabel: string;
  kicker: string;
  title: string;
  status: string;
  description: string;
  journey?: JourneyHeaderData;
  surveyBanner?: ReactNode;
  children?: ReactNode;
};

export function MainContent({
  activeLabel,
  children,
  kicker,
  title,
  status,
  description,
  journey,
  surveyBanner,
}: MainContentProps) {
  return (
    <main className="min-h-[calc(100dvh-56px)] overflow-y-auto px-5 pb-28 pt-9 md:px-10 md:pb-12">
      {surveyBanner}
      {children ? (
        <div className="module-content mx-auto w-full max-w-[1180px]">
          {journey ? <JourneyHeader activeLabel={activeLabel} data={journey} /> : null}
          {children}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[560px]">
          <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-subtle">
            <span className="grid h-6 w-6 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
              ◇
            </span>
            <span>{kicker}</span>
          </div>

          <section className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
            <header className="flex items-center justify-between border-b border-border-soft bg-surface-soft px-5 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-subtle">
                  {title}
                </p>
                <h1 className="mt-1 font-brand text-lg font-bold text-ink">
                  {activeLabel}
                </h1>
              </div>
              <span className="rounded-[3px] border border-border bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
                {status}
              </span>
            </header>

            <div className="px-5 py-6 text-sm leading-7 text-muted">
              <p>{description}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
