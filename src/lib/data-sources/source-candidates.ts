import type {
  DataGroup,
  SourceAccessMethod,
  SourceEvidenceStatus,
  SourceUsageMode,
  SourceUsageStatus,
} from "./types";

export type SourceCandidateCategory =
  | "official_exchange"
  | "official_company_filing"
  | "regulator_or_government"
  | "official_macro_statistical"
  | "commercial_vendor"
  | "broker_or_data_portal"
  | "public_finance_website"
  | "manual_academic_dataset"
  | "external_audit_source"
  | "private_or_undocumented_api"
  | "scraped_source";

export type CandidateDecision =
  | "proceed_to_manual_review"
  | "research_only"
  | "defer"
  | "blocked"
  | "not_enough_information";

export type RiskLevel = "low" | "medium" | "high" | "blocked" | "unknown";

export type SourceCandidate = {
  candidateId: string;
  name: string;
  category: SourceCandidateCategory;
  dataGroups: DataGroup[];
  exampleSources: string[];
  accessMethod: SourceAccessMethod;
  currentPolicyStatus: SourceUsageStatus;
  evidenceStatus: SourceEvidenceStatus;
  candidateDecision: CandidateDecision;
  legalRisk: RiskLevel;
  technicalRisk: RiskLevel;
  allowedModes: SourceUsageMode[];
  requiredEvidenceBeforeAdapter: string[];
  notes: string;
};

export type CandidateAdapterEvaluation = {
  candidateId: string;
  adapterReady: boolean;
  productionReady: boolean;
  allowedModes: SourceUsageMode[];
  blockers: string[];
  nextAction: CandidateDecision;
};

export const SOURCE_CANDIDATES: SourceCandidate[] = [
  {
    candidateId: "official-exchange-market-data",
    name: "Official exchange market data",
    category: "official_exchange",
    dataGroups: ["market", "company_profile"],
    exampleSources: ["HOSE", "HNX", "UPCoM"],
    accessMethod: "official_download",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "proceed_to_manual_review",
    legalRisk: "medium",
    technicalRisk: "medium",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Official source documentation URL",
      "License or data usage terms",
      "Runtime display permission",
      "Caching permission and cache duration",
      "Derived-data permission for ratios/readiness",
      "Attribution requirements",
    ],
    notes: "High authority candidate, but not approved until exchange data rights are reviewed.",
  },
  {
    candidateId: "official-company-filings",
    name: "Official company filings and investor relations",
    category: "official_company_filing",
    dataGroups: ["financial_statement", "company_profile", "valuation"],
    exampleSources: ["Company annual reports", "Investor relations pages", "Exchange filing pages"],
    accessMethod: "official_download",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "proceed_to_manual_review",
    legalRisk: "medium",
    technicalRisk: "high",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Document license or public-use terms",
      "Attribution rules",
      "Statement period/asOf fields",
      "Manual extraction or parser QA plan",
      "Caching/storage rights for downloaded filings",
    ],
    notes: "Authority is strong, but parsing statements consistently is non-trivial.",
  },
  {
    candidateId: "regulator-government-disclosures",
    name: "Regulator or government disclosure data",
    category: "regulator_or_government",
    dataGroups: ["company_profile", "risk", "financial_statement"],
    exampleSources: ["SSC or equivalent regulator portals"],
    accessMethod: "public_web",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "proceed_to_manual_review",
    legalRisk: "medium",
    technicalRisk: "medium",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Terms of use",
      "Public display rights",
      "Caching/storage rights",
      "Disclosure period and source metadata",
    ],
    notes: "Potentially useful for transparency and filing-status checks, pending source evidence.",
  },
  {
    candidateId: "official-macro-statistical",
    name: "Official macro/statistical data",
    category: "official_macro_statistical",
    dataGroups: ["macro"],
    exampleSources: ["GSO", "SBV or equivalent official macro/statistical sources"],
    accessMethod: "official_download",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "proceed_to_manual_review",
    legalRisk: "medium",
    technicalRisk: "medium",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "License or public data terms",
      "Attribution requirements",
      "Release calendar/asOf semantics",
      "Caching and derived-data rights",
    ],
    notes: "Good authority candidate for macro context, but no production approval without explicit terms.",
  },
  {
    candidateId: "commercial-data-vendors",
    name: "Commercial data vendors",
    category: "commercial_vendor",
    dataGroups: ["market", "financial_statement", "valuation", "industry", "company_profile", "macro"],
    exampleSources: ["FiinTrade or similar licensed vendors"],
    accessMethod: "licensed_feed",
    currentPolicyStatus: "unknown",
    evidenceStatus: "missing",
    candidateDecision: "not_enough_information",
    legalRisk: "high",
    technicalRisk: "medium",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Signed license scope",
      "API documentation",
      "Runtime display permission",
      "Caching and redistribution clauses",
      "Derived-data clauses",
      "Cost and rate-limit terms",
    ],
    notes: "Potentially robust, but cost/license restrictions need explicit review.",
  },
  {
    candidateId: "broker-data-portal-apis",
    name: "Broker or data portal APIs",
    category: "broker_or_data_portal",
    dataGroups: ["market", "financial_statement", "valuation", "company_profile"],
    exampleSources: ["SSI", "VNDIRECT", "Vietcap", "Vietstock APIs if officially documented"],
    accessMethod: "official_api",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "defer",
    legalRisk: "high",
    technicalRisk: "high",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Official API documentation",
      "Terms allowing product runtime use",
      "Authentication and rate-limit policy",
      "Caching/runtime display/derived-data rights",
      "No private or undocumented endpoint dependency",
    ],
    notes: "Do not use unless access is documented and rights are explicit.",
  },
  {
    candidateId: "public-finance-websites",
    name: "Public finance websites",
    category: "public_finance_website",
    dataGroups: ["market", "financial_statement", "valuation", "company_profile"],
    exampleSources: ["CafeF", "FireAnt", "Vietstock public pages or similar"],
    accessMethod: "public_web",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "defer",
    legalRisk: "high",
    technicalRisk: "high",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Terms allowing automated access or API use",
      "Runtime display rights",
      "Caching and derived-data rights",
      "Attribution requirements",
      "Source stability and anti-scraping risk assessment",
    ],
    notes: "Useful for research comparison only until rights and access method are verified.",
  },
  {
    candidateId: "manual-academic-upload",
    name: "Manually uploaded academic/thesis dataset",
    category: "manual_academic_dataset",
    dataGroups: ["market", "financial_statement", "macro", "industry", "company_profile"],
    exampleSources: ["Small manually reviewed thesis fixture", "Instructor-provided dataset with permission"],
    accessMethod: "manual_upload",
    currentPolicyStatus: "research_only",
    evidenceStatus: "partially_verified",
    candidateDecision: "research_only",
    legalRisk: "medium",
    technicalRisk: "medium",
    allowedModes: ["development", "thesis_verification"],
    requiredEvidenceBeforeAdapter: [
      "Dataset provenance",
      "Academic-use permission",
      "No public runtime use unless license permits",
      "Source/asOf/period metadata per record",
      "Missing-data and duplicate-period checks",
    ],
    notes: "Safest near-term path for thesis/local verification, not production API runtime.",
  },
  {
    candidateId: "external-audit-repo-sources",
    name: "Sources found in external repo audit",
    category: "external_audit_source",
    dataGroups: ["market", "financial_statement", "macro", "industry", "company_profile"],
    exampleSources: ["Valky audit data docs and scripts", "Pttuan backend/database reference"],
    accessMethod: "unknown",
    currentPolicyStatus: "research_only",
    evidenceStatus: "missing",
    candidateDecision: "research_only",
    legalRisk: "high",
    technicalRisk: "high",
    allowedModes: ["development", "thesis_verification"],
    requiredEvidenceBeforeAdapter: [
      "Do not copy data/scripts",
      "Independent source evidence",
      "Rewrite adapter from scratch",
      "No missing-to-zero behavior",
      "Legal review of original data sources",
    ],
    notes: "Research input only. Not production-approved and not a code/data import source.",
  },
  {
    candidateId: "private-undocumented-apis",
    name: "Private or undocumented APIs",
    category: "private_or_undocumented_api",
    dataGroups: ["market", "financial_statement", "macro"],
    exampleSources: ["Any hidden endpoint discovered by inspection"],
    accessMethod: "private_or_undocumented_api",
    currentPolicyStatus: "blocked",
    evidenceStatus: "missing",
    candidateDecision: "blocked",
    legalRisk: "blocked",
    technicalRisk: "blocked",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Do not proceed unless source owner grants documented API rights",
    ],
    notes: "Blocked by default. No production adapter should be written against this category.",
  },
  {
    candidateId: "scraped-sources",
    name: "Scraped web sources",
    category: "scraped_source",
    dataGroups: ["market", "financial_statement", "macro", "industry", "company_profile"],
    exampleSources: ["HTML scraping of public pages"],
    accessMethod: "scraped",
    currentPolicyStatus: "needs_legal_review",
    evidenceStatus: "missing",
    candidateDecision: "defer",
    legalRisk: "high",
    technicalRisk: "high",
    allowedModes: [],
    requiredEvidenceBeforeAdapter: [
      "Terms allowing scraping",
      "Robots/access review where relevant",
      "Rate-limit policy",
      "Runtime display/caching/derived-data rights",
      "Fallback behavior when page structure changes",
    ],
    notes: "Requires legal review and stability assessment. Not production-approved.",
  },
];

export const evaluateCandidateForAdapter = (
  candidate: SourceCandidate,
  mode: SourceUsageMode = "production",
): CandidateAdapterEvaluation => {
  const blockers: string[] = [];

  if (candidate.currentPolicyStatus === "blocked") {
    blockers.push("Source policy status is blocked.");
  }

  if (candidate.evidenceStatus !== "verified") {
    blockers.push("Source evidence is not verified.");
  }

  if (candidate.accessMethod === "private_or_undocumented_api") {
    blockers.push("Private or undocumented access is not adapter-ready.");
  }

  if (candidate.currentPolicyStatus === "unknown") {
    blockers.push("Source policy status is unknown.");
  }

  if (candidate.currentPolicyStatus === "needs_legal_review") {
    blockers.push("Source still needs legal review.");
  }

  if (candidate.currentPolicyStatus === "research_only" && mode === "production") {
    blockers.push("Research-only sources cannot run in production mode.");
  }

  if (!candidate.allowedModes.includes(mode)) {
    blockers.push(`Candidate is not allowed in ${mode} mode.`);
  }

  const productionReady =
    mode === "production" &&
    candidate.currentPolicyStatus === "approved" &&
    candidate.evidenceStatus === "verified" &&
    blockers.length === 0;

  return {
    candidateId: candidate.candidateId,
    adapterReady: blockers.length === 0,
    productionReady,
    allowedModes: candidate.allowedModes,
    blockers,
    nextAction: blockers.length === 0 ? candidate.candidateDecision : candidate.candidateDecision,
  };
};

export const getCandidatesByDataGroup = (dataGroup: DataGroup): SourceCandidate[] =>
  SOURCE_CANDIDATES.filter((candidate) => candidate.dataGroups.includes(dataGroup));

export const getBlockedCandidates = (): SourceCandidate[] =>
  SOURCE_CANDIDATES.filter((candidate) => candidate.currentPolicyStatus === "blocked" || candidate.candidateDecision === "blocked");

export const getCandidatesNeedingLegalReview = (): SourceCandidate[] =>
  SOURCE_CANDIDATES.filter((candidate) => candidate.currentPolicyStatus === "needs_legal_review");

