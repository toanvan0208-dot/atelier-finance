import { prisma } from "../src/lib/database/client";
import { loadLatestMacroObservations } from "../src/features/macro/lib/macro-observation-read-path";

async function run() {
    console.log("Starting Post-Write Macro Data Smoke Test...");

    const summary = {
        phase: "147C",
        mode: "macro_data_after_write_smoke",
        tickersChecked: "not_applicable",
        indicatorsChecked: ["CPI_YOY", "GDP_GROWTH"],
        macroIndicatorRowCount: 0,
        macroObservationRowCount: 0,
        macroProvenanceRowCount: 0,
        cpiObservationAvailable: false,
        gdpObservationAvailable: false,
        provenanceAvailable: false,
        loaderReadPathAvailable: false,
        loaderObservationCount: 0,
        productionApprovedTrueCount: 0,
        needsReviewTrueCount: 0,
        dataModeCounts: {} as Record<string, number>,
        providerTypeCounts: {} as Record<string, number>,
        warningCodesReadable: false,
        dbWriteAttempted: false,
        smokePassed: false
    };

    try {
        summary.macroIndicatorRowCount = await prisma.macroIndicator.count();
        summary.macroObservationRowCount = await prisma.macroObservation.count();
        summary.macroProvenanceRowCount = await prisma.macroObservationProvenance.count();

        const cpi = await prisma.macroObservation.findFirst({
            where: { indicatorCode: "CPI_YOY", sourceLabel: "world_bank_candidate" }
        });
        if (cpi) summary.cpiObservationAvailable = true;

        const gdp = await prisma.macroObservation.findFirst({
            where: { indicatorCode: "GDP_GROWTH", sourceLabel: "world_bank_candidate" }
        });
        if (gdp) summary.gdpObservationAvailable = true;

        const prov = await prisma.macroObservationProvenance.findFirst({
            where: { sourceLabel: "world_bank_candidate" }
        });
        if (prov) {
            summary.provenanceAvailable = true;
            summary.warningCodesReadable = true;
        }

        const readResult = await loadLatestMacroObservations();
        if (readResult.observations.length > 0) {
            summary.loaderReadPathAvailable = true;
            summary.loaderObservationCount = readResult.observations.length;
        }

        const allObs = await prisma.macroObservation.findMany();
        for (const obs of allObs) {
            if (obs.productionApproved) summary.productionApprovedTrueCount++;
            if (obs.needsReview) summary.needsReviewTrueCount++;
            summary.dataModeCounts[obs.dataMode] = (summary.dataModeCounts[obs.dataMode] || 0) + 1;
        }

        const allProv = await prisma.macroObservationProvenance.findMany();
        for (const p of allProv) {
            if (p.productionApproved) summary.productionApprovedTrueCount++;
            if (p.needsReview) summary.needsReviewTrueCount++;
            summary.providerTypeCounts[p.providerType] = (summary.providerTypeCounts[p.providerType] || 0) + 1;
        }

        if (summary.cpiObservationAvailable && summary.gdpObservationAvailable && summary.provenanceAvailable && summary.loaderReadPathAvailable && summary.productionApprovedTrueCount === 0) {
            summary.smokePassed = true;
        }

        console.log("\n--- Macro Post-Write Smoke Summary ---");
        for (const [key, value] of Object.entries(summary)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                console.log(`${key}: ${Object.entries(value).map(([k,v]) => `${k}:${v}`).join(', ')}`);
            } else if (Array.isArray(value)) {
                console.log(`${key}: ${value.join(', ')}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

    } catch (error: any) {
        console.error("\nSmoke test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
