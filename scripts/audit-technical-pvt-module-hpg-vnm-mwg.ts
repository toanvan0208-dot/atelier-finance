import "dotenv/config";
import { prisma } from "../src/lib/database/client";
import { loadTechnicalRuntimeData } from "../src/features/technical/lib/load-technical-runtime-data";

const auditTechnicalPvtModule = async () => {
  const targetTickers = ["HPG", "VNM", "MWG"];
  const summary: Record<string, any> = {};

  try {
    for (const ticker of targetTickers) {
      const data = await loadTechnicalRuntimeData({ ticker, preferDb: true, allowFallback: false });
      summary[ticker] = {
        ok: data.ok,
        hasData: !!data.data,
        fallbackUsed: data.fallbackUsed,
        errors: data.errors,
        warnings: data.warnings,
      };
    }
  } catch (error) {
    console.error(error);
  } finally {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  }
};

auditTechnicalPvtModule();
