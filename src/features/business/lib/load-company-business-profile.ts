import { prisma } from "@/lib/database/client";

export type LoadCompanyBusinessProfileOptions = {
  dataMode?: string;
  profileLanguage?: string;
};

export const loadCompanyBusinessProfile = async (
  ticker: string,
  options?: LoadCompanyBusinessProfileOptions
) => {
  const normalizedTicker = ticker.trim().toUpperCase();
  const dataMode = options?.dataMode ?? "research_only";
  const profileLanguage = options?.profileLanguage ?? "vi";
  const sourceLabel = "staging_company_business_profile_research_seed";

  const profile = await prisma.companyBusinessProfile.findUnique({
    where: {
      ticker_sourceLabel_profileLanguage: {
        ticker: normalizedTicker,
        sourceLabel,
        profileLanguage,
      },
    },
  });

  if (!profile) {
    return null;
  }

  // Strict guardrails: verify dataMode and productionApproved status
  if (profile.dataMode !== dataMode) {
    return null;
  }

  // We explicitly fetch research_only which implies productionApproved = false
  if (profile.productionApproved !== false) {
    return null;
  }

  return {
    businessDescription: profile.businessDescription || "Chưa đủ dữ liệu",
    mainProducts: profile.mainProducts || "Chưa đủ dữ liệu",
    businessRiskNotes: profile.businessRiskNotes || "Chưa đủ dữ liệu",
    sourceLabel: profile.sourceLabel,
    dataMode: profile.dataMode,
    productionApproved: profile.productionApproved,
    needsReview: profile.needsReview,
    profileLanguage: profile.profileLanguage,
  };
};
