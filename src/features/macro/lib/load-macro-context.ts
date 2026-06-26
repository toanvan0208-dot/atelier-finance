import { prisma } from "../../../lib/database/client";

export async function loadMacroContext() {
  const macros = await prisma.macroContext.findMany({
    where: {
      productionApproved: false,
      needsReview: true,
      contextLanguage: "vi",
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const validMacros = macros.filter(m => m.dataMode === "research_only");

  if (validMacros.length === 0) return null;

  return validMacros[0];
}
