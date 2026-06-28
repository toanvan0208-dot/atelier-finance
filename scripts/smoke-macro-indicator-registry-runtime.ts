import { loadMacroRuntimeData } from "../src/features/macro/lib/load-macro-runtime-data";

async function runSmoke() {
  console.log("=== Smoke Test: Macro Indicator Registry Runtime ===");
  try {
    const data = await loadMacroRuntimeData();
    
    console.log(`indicatorUniverse length: ${data.indicatorUniverse?.length}`);
    console.log(`dbBackedIndicators: ${data.dbBackedIndicators?.join(", ")}`);
    console.log(`plannedIndicators: ${data.plannedIndicators?.join(", ")}`);
    console.log(`sourceAssessmentNeededIndicators: ${data.sourceAssessmentNeededIndicators?.join(", ")}`);

    const gdp = data.indicatorUniverse?.find(i => i.indicatorCode === "GDP_GROWTH");
    const pmi = data.indicatorUniverse?.find(i => i.indicatorCode === "PMI_MANUFACTURING");

    console.log(`GDP Support Status: ${gdp?.supportStatus}`);
    console.log(`GDP DB Data Present: ${!!gdp?.latestObservation}`);
    
    console.log(`PMI Support Status: ${pmi?.supportStatus}`);
    console.log(`PMI DB Data Present: ${!!pmi?.latestObservation}`);
    
    if (data.dbBackedIndicators?.includes("GDP_GROWTH") && 
        data.dbBackedIndicators?.includes("CPI_YOY") &&
        data.plannedIndicators?.includes("USD_VND") &&
        !data.dbBackedIndicators.includes("PMI_MANUFACTURING")) {
      console.log("smokeResult: PASS");
    } else {
      console.log("smokeResult: FAIL");
    }
  } catch (error) {
    console.error("smokeResult: FAIL", error);
  }
}

runSmoke();
