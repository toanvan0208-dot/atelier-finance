import Link from "next/link";
import { surveyDemoRoute, surveyFormUrl } from "@/features/survey-demo";

type SurveyModeBannerProps = {
  isVisible: boolean;
};

export function SurveyModeBanner({ isVisible }: SurveyModeBannerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-10 mb-5 border-[1.5px] border-border bg-accent-soft px-4 py-3 shadow-hard-sm"
      data-testid="survey-mode-banner"
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 text-xs leading-5 text-ink md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">
          You are viewing Survey Demo Mode. The content is for evaluating the
          product experience only; it is not investment advice and does not
          provide trading or holding instructions.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-[3px] border-[1.5px] border-border bg-surface px-3 py-2 font-bold shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
            href={surveyDemoRoute}
          >
            Back to demo guide
          </Link>
          {surveyFormUrl ? (
            <Link
              className="rounded-[3px] border-[1.5px] border-border bg-accent px-3 py-2 font-bold shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-[#DCA900]"
              href={surveyFormUrl}
            >
              Back to survey form
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
