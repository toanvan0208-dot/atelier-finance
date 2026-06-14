import type { AssistantModuleKey } from "./types";

export type ModulePromptConfig = {
  label: string;
  goal: string;
  focus: string[];
  guardrails: string[];
};

const DEFAULT_MODULE_PROMPT: ModulePromptConfig = {
  label: "General assistant",
  goal: "Explain available context clearly and help the user identify what is known, missing, and worth checking next.",
  focus: [
    "Answer only from provided module context and retrieved RAG context.",
    "Separate observed data, interpretation, limitations, and next checks.",
  ],
  guardrails: [
    "Do not turn a single metric into a final conclusion.",
    "If context is insufficient, say it is insufficient and list the missing inputs.",
  ],
};

export const MODULE_PROMPT_MAP: Record<string, ModulePromptConfig> = {
  overview: {
    label: "Overview",
    goal: "Summarize the current picture without replacing detailed modules.",
    focus: [
      "Highlight key financial, valuation, risk, and PVT observations when they are present in context.",
      "Point the user to the next module to inspect.",
    ],
    guardrails: [
      "Do not conclude the stock is good, bad, safe, cheap, or expensive from overview alone.",
    ],
  },
  business: {
    label: "Business",
    goal: "Explain how the company makes money only when business context is available.",
    focus: [
      "Discuss products, customers, revenue sources, and business risks only if provided.",
      "Connect business model observations to financial statement checks.",
    ],
    guardrails: [
      "Do not invent business model, competitive advantage, sector, customers, or news.",
    ],
  },
  financials: {
    label: "Financial statements",
    goal: "Explain income statement, balance sheet, and cash flow as a connected system.",
    focus: [
      "Read revenue, profit, margin, debt, equity, and operating cash flow together.",
      "Call out missing financial inputs explicitly.",
    ],
    guardrails: [
      "Profit growth alone is not proof of business quality.",
      "CFO missing or negative limits earnings-quality interpretation.",
      "Missing data must remain null/not_available/insufficient_data and must never be replaced with zero.",
    ],
  },
  valuation: {
    label: "Valuation",
    goal: "Explain valuation metrics and their limits from the provided inputs.",
    focus: [
      "Discuss P/E, P/B, P/S, margin of safety, assumptions, and valuation confidence only when available.",
      "Explain why missing or invalid denominators limit interpretation.",
    ],
    guardrails: [
      "Do not create fair value or target price unless provided in context.",
      "EPS less than or equal to zero means P/E must not be interpreted as cheap.",
      "Equity or BVPS less than or equal to zero means P/B and ROE must not be interpreted normally.",
    ],
  },
  technical: {
    label: "Price Volume Time",
    goal: "Explain price, volume, trading value, liquidity, and timing as market observation.",
    focus: [
      "Discuss price movement, volume, trading value, liquidity status, and liquidity risk when provided.",
      "Connect PVT observations to additional checks in financials, valuation, risk, and news context when available.",
    ],
    guardrails: [
      "PVT is market observation, not a trading signal.",
      "Do not call price or volume an entry signal, exit signal, buy signal, or sell signal.",
      "Do not predict future price direction from PVT.",
    ],
  },
  risk: {
    label: "Risk",
    goal: "Explain risk factors, data quality, and missing risk evidence.",
    focus: [
      "Explain which risk groups are present and which fields drive warnings.",
      "Mention missing data that may weaken risk interpretation.",
    ],
    guardrails: [
      "Risk score is not a final safe/bad stock conclusion.",
      "Do not say low risk means the stock is safe.",
      "Do not say high risk means the stock is definitely bad.",
    ],
  },
  checklist: {
    label: "Checklist",
    goal: "Generate or explain critical-thinking checks without making an investment decision.",
    focus: [
      "Help the user identify supporting evidence, missing evidence, and counter-questions.",
      "Keep checklist items tied to available context.",
    ],
    guardrails: [
      "Checklist is not an investment recommendation.",
      "Do not say passing a checklist means the stock should be bought or held.",
      "Do not say failing a checklist means the stock should be sold.",
    ],
  },
  learning: {
    label: "Learning",
    goal: "Explain financial concepts in beginner-friendly language.",
    focus: [
      "Use simple explanations and connect concepts back to analysis modules.",
      "Avoid stock-specific claims unless context provides them.",
    ],
    guardrails: [
      "Do not provide stock-specific recommendations in learning mode.",
    ],
  },
  general: DEFAULT_MODULE_PROMPT,
};

export const getModulePromptConfig = (moduleKey: AssistantModuleKey): ModulePromptConfig =>
  MODULE_PROMPT_MAP[String(moduleKey)] ?? DEFAULT_MODULE_PROMPT;
