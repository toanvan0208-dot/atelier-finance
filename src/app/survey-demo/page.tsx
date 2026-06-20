import type { Metadata } from "next";
import Link from "next/link";
import {
  optionalAiDemoNote,
  surveyDemoIntro,
  surveyDemoSafetyNotices,
  surveyDemoSteps,
  surveyFormUrl,
} from "@/features/survey-demo";

export const metadata: Metadata = {
  title: "Survey Demo Mode | Atelier Finance",
  description:
    "A limited Atelier Finance demo path for Survey Form 2 post-experience evaluation.",
};

export default function SurveyDemoPage() {
  return (
    <main className="min-h-dvh bg-page px-4 py-6 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <header className="border-[1.5px] border-border bg-surface px-5 py-6 shadow-soft sm:px-7 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-subtle">
            {surveyDemoIntro.kicker}
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="font-brand text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {surveyDemoIntro.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {surveyDemoIntro.description}
              </p>
            </div>
            <div className="border-[1.5px] border-border bg-accent-soft px-4 py-4 text-sm font-semibold leading-6 text-ink">
              {surveyDemoIntro.limitation}
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft sm:px-6">
            <div className="flex flex-col gap-3 border-b border-border-soft pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.04em] text-subtle">
                  Guided path
                </p>
                <h2 className="mt-1 text-xl font-bold text-ink">
                  Review four representative modules
                </h2>
              </div>
              <Link
                className="inline-flex items-center justify-center rounded-[3px] border-[1.5px] border-border bg-accent px-4 py-2 text-sm font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-[#DCA900]"
                href={surveyDemoSteps[0].href}
              >
                Start demo
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {surveyDemoSteps.map((step) => (
                <article
                  className="grid gap-4 border border-border-soft bg-surface-soft px-4 py-4 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center"
                  key={step.moduleKey}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-[3px] border-[1.5px] border-border bg-surface text-sm font-bold text-ink shadow-hard-sm">
                    {step.stepNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {step.observation}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-[3px] border-[1.5px] border-border bg-surface px-3 py-2 text-xs font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
                    href={step.href}
                  >
                    Open module
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <section className="border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-subtle">
                Safety notes
              </p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted">
                {surveyDemoSafetyNotices.map((notice) => (
                  <li className="border-l-[3px] border-accent pl-3" key={notice}>
                    {notice}
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-subtle">
                Optional AI observation
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{optionalAiDemoNote}</p>
            </section>

            {surveyFormUrl ? (
              <Link
                className="inline-flex items-center justify-center rounded-[3px] border-[1.5px] border-border bg-accent px-4 py-3 text-sm font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-[#DCA900]"
                href={surveyFormUrl}
              >
                Return to survey form
              </Link>
            ) : null}
          </aside>
        </section>
      </section>
    </main>
  );
}
