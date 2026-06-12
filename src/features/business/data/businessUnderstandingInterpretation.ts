import type { BusinessUnderstandingProfile } from "./businessUnderstandingByTicker";
import { getBusinessIndustryRule } from "./businessUnderstandingRules";

export type BusinessSectionKey =
  | "customerAndProduct"
  | "moneyFlow"
  | "competitivePosition"
  | "businessConditions";

export function buildBusinessUnderstandingInterpretation(profile: BusinessUnderstandingProfile) {
  const rule = getBusinessIndustryRule(profile);

  return {
    headline: profile.overview.headline,
    lead: profile.overview.shortDescription,
    keyTakeaway: profile.overview.keyTakeaway,
    ruleSummary: rule.interpretation,
    focusAreas: rule.focusAreas,
    watchSignals: rule.watchSignals,
  };
}

export function getBusinessSectionMeaning(
  profile: BusinessUnderstandingProfile,
  sectionKey: BusinessSectionKey
) {
  const rule = getBusinessIndustryRule(profile);
  const section = profile[sectionKey];

  return {
    analysisMeaning: section.analysisMeaning || rule.interpretation,
    commonMisread: section.commonMisread,
    ruleSummary: rule.interpretation,
  };
}
