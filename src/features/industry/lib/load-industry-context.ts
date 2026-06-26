import { prisma } from "../../../lib/database/client";

export async function loadIndustryContextByTicker(ticker: string) {
  const industries = await prisma.industryContext.findMany({
    where: {
      productionApproved: false,
      needsReview: true,
      contextLanguage: "vi",
      relatedTickers: {
        has: ticker
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const validIndustries = industries.filter(i => i.dataMode === "research_only");

  if (validIndustries.length === 0) return null;

  return validIndustries[0];
}
