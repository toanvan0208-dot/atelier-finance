import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data";
import { prisma } from "../src/lib/database/client";

async function run() {
  console.log("=== Macro UI DB Read Path Smoke Test ===");
  try {
    const data = await loadMacroRuntimeData();
    const cpi = data.vietnamMetrics.find(m => m.id === "cpi");
    const gdp = data.vietnamMetrics.find(m => m.id === "gdp");
    
    console.log("CPI Source:", cpi?.sourceName);
    console.log("CPI Value:", cpi?.value, cpi?.unit);
    console.log("CPI Status:", cpi?.status);
    console.log("GDP Source:", gdp?.sourceName);
    console.log("GDP Value:", gdp?.value, gdp?.unit);
    console.log("GDP Status:", gdp?.status);

    if (cpi?.status === "available" && gdp?.status === "available" && cpi?.sourceName?.includes("World Bank")) {
      console.log("SUCCESS: Macro UI DB read path is functional.");
      process.exit(0);
    } else {
      console.log("FAILED: Data not properly loaded from DB.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error during smoke test:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
