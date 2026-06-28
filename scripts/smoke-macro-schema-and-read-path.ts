import { prisma } from "../src/lib/database/client";
import { loadLatestMacroObservations } from "../src/features/macro/lib/macro-observation-read-path";

async function run() {
    console.log("Starting Macro Schema and Read-Path Smoke Test...");
    
    const summary = {
        phase: "147B",
        mode: "macro_schema_and_read_path_smoke",
        macroIndicatorModelAvailable: false,
        macroObservationModelAvailable: false,
        macroObservationProvenanceModelAvailable: false,
        macroIndicatorRowCount: 0,
        macroObservationRowCount: 0,
        macroObservationProvenanceRowCount: 0,
        loaderAvailable: false,
        loaderHandlesEmptyData: false,
        dbWriteAttempted: false,
        smokePassed: false
    };

    try {
        // 1. Check Schema Models and Row Counts
        if (prisma.macroIndicator) {
            summary.macroIndicatorModelAvailable = true;
            summary.macroIndicatorRowCount = await prisma.macroIndicator.count();
        }
        
        if (prisma.macroObservation) {
            summary.macroObservationModelAvailable = true;
            summary.macroObservationRowCount = await prisma.macroObservation.count();
        }
        
        if (prisma.macroObservationProvenance) {
            summary.macroObservationProvenanceModelAvailable = true;
            summary.macroObservationProvenanceRowCount = await prisma.macroObservationProvenance.count();
        }

        // 2. Check Read-Path Loader
        summary.loaderAvailable = typeof loadLatestMacroObservations === "function";

        if (summary.loaderAvailable) {
            // Load from an empty or non-empty DB safely without writing
            const result = await loadLatestMacroObservations({
                indicatorCodes: ["CPI_YOY", "GDP_GROWTH"],
                region: "VN"
            }, prisma);

            // The loader should return an object with 'available' property.
            // If the DB is empty for these codes, available=false or it returns available=true with empty observations
            // Both are acceptable, it just shouldn't throw an error.
            if (result && typeof result.available === "boolean") {
                summary.loaderHandlesEmptyData = true;
            }
        }

        if (
            summary.macroIndicatorModelAvailable &&
            summary.macroObservationModelAvailable &&
            summary.macroObservationProvenanceModelAvailable &&
            summary.loaderAvailable &&
            summary.loaderHandlesEmptyData
        ) {
            summary.smokePassed = true;
        }

        console.log("\n--- Macro Schema and Read-Path Smoke Summary ---");
        for (const [key, value] of Object.entries(summary)) {
            console.log(`${key}: ${value}`);
        }

    } catch (error: any) {
        console.error("\nSmoke Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
