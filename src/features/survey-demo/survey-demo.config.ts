export type SurveyDemoStep = {
  stepNumber: number;
  title: string;
  moduleKey: "overview" | "financials" | "risk" | "checklist";
  href: string;
  observation: string;
};

export const surveyDemoRoute = "/survey-demo";

export const surveyFormUrl = process.env.NEXT_PUBLIC_SURVEY_FORM_URL ?? "";

export const surveyDemoIntro = {
  title: "Atelier Finance Survey Demo Mode",
  kicker: "Survey Form 2 evaluation",
  description:
    "A limited, read-only path through selected Atelier Finance modules for short post-experience user evaluation.",
  limitation:
    "Survey Demo Mode represents selected functions for initial user perception. It does not replace long-term usability testing or a full production evaluation.",
};

export const surveyDemoSafetyNotices = [
  "This is a limited survey demo version of Atelier Finance for user evaluation.",
  "It is used for Survey Form 2 and post-experience evaluation.",
  "It is not investment advice and does not provide trading or holding instructions.",
  "It does not require login, securities account details, bank account details, phone number, OTP, or personal financial data.",
  "Displayed data may be demo, seed, or sample data and is only used to evaluate user experience.",
];

export const surveyDemoSteps: SurveyDemoStep[] = [
  {
    stepNumber: 1,
    title: "Overview",
    moduleKey: "overview",
    href: "/workspace?module=overview&survey=1",
    observation:
      "See how the workspace frames the analysis journey and keeps the user oriented before entering detailed modules.",
  },
  {
    stepNumber: 2,
    title: "Financial Statements",
    moduleKey: "financials",
    href: "/workspace?module=financials&survey=1",
    observation:
      "Review how financial statements, ratios, data quality notes, and context are presented for interpretation.",
  },
  {
    stepNumber: 3,
    title: "Risk and Transparency",
    moduleKey: "risk",
    href: "/workspace?module=risk&survey=1",
    observation:
      "Check whether risk factors, missing information, and transparency cues are visible before any decision is made.",
  },
  {
    stepNumber: 4,
    title: "Checklist and Reasoning Check",
    moduleKey: "checklist",
    href: "/workspace?module=checklist&survey=1",
    observation:
      "Use the checklist flow to inspect assumptions, missing evidence, and reasoning quality.",
  },
];

export const optionalAiDemoNote =
  "The AI assistant panel is optional in this survey flow. If it is available, use it only to observe explanation style, source transparency, uncertainty handling, and safety behavior.";

export function getSurveyDemoUserFacingCopy() {
  return [
    surveyDemoIntro.title,
    surveyDemoIntro.kicker,
    surveyDemoIntro.description,
    surveyDemoIntro.limitation,
    ...surveyDemoSafetyNotices,
    ...surveyDemoSteps.flatMap((step) => [
      step.title,
      step.observation,
      step.href,
    ]),
    optionalAiDemoNote,
  ];
}
