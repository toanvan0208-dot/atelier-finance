import { prisma } from "../src/lib/database/client";

// This is a memory-only dry-run preview.
// No data will be written to the DB.
const dryRun = true;

async function run() {
    console.log("Starting Macro Data Ingestion to Schema Preview (Fail-Closed)...");

    
    const summary = {
        phase: "147B",
        mode: "macro_data_ingestion_to_schema_preview",
        dryRun: dryRun,
        dbWriteAttempted: false,
        schemaModelsAvailable: false,
        sourcesChecked: [] as string[],
        indicatorsChecked: [] as string[],
        providerFetchAttempted: false,
        providerFetchSucceeded: false,
        candidateMacroIndicators: 0,
        candidateMacroObservations: 0,
        candidateMacroProvenanceRows: 0,
        candidateRowsValidForSchema: false,
        previewBlocked: false,
        previewBlockedReasons: [] as string[],
        productionApprovedTrueCount: 0,
        needsReviewTrueCount: 0,
        warningCodeCounts: {} as Record<string, number>,
        readyForMacroConfirmWritePhase: false,
        readyForProductionApproval: false,
        smokePassed: false
    };

    try {
        // 1. Verify Schema Models Available
        // We'll just verify the client shape has the models.
        if (prisma.macroIndicator && prisma.macroObservation && prisma.macroObservationProvenance) {
            summary.schemaModelsAvailable = true;
        } else {
            throw new Error("Macro Prisma models are not available on the client. Did you run prisma generate?");
        }

        // 2. World Bank candidate fetching
        const sources = [
            {
                code: "CPI_YOY",
                name: "CPI / Lạm phát",
                url: "https://api.worldbank.org/v2/country/VNM/indicator/FP.CPI.TOTL.ZG?format=json&per_page=5"
            },
            {
                code: "GDP_GROWTH",
                name: "Tăng trưởng GDP",
                url: "https://api.worldbank.org/v2/country/VNM/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5"
            }
        ];

        const candidateIndicators: any[] = [];
        const candidateObservations: any[] = [];
        const candidateProvenances: any[] = [];
        
        summary.sourcesChecked.push("World Bank API");
        summary.providerFetchAttempted = true;

        for (const source of sources) {
            summary.indicatorsChecked.push(source.code);
            try {
                const response = await fetch(source.url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${source.url}: ${response.statusText}`);
                }
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                    const latestRecord = data[1].find((r: any) => r.value !== null);
                    
                    if (latestRecord) {
                        // Create Indicator Mapping
                        const ind = {
                            indicatorCode: source.code,
                            indicatorName: source.name,
                            category: "economy",
                            defaultUnit: "% YoY",
                            defaultFrequency: "annual",
                            regionScope: "VN",
                            sourceLabel: "World Bank API",
                            isActive: true
                        };
                        candidateIndicators.push(ind);

                        // Create Observation Mapping
                        const obs = {
                            indicatorCode: source.code,
                            region: "VN",
                            observationDate: new Date(`${latestRecord.date}-12-31`),
                            value: latestRecord.value,
                            unit: "% YoY",
                            frequency: "annual",
                            periodLabel: latestRecord.date,
                            sourceLabel: "World Bank API",
                            dataMode: "candidate_macro_data",
                            productionApproved: false,
                            needsReview: true
                        };
                        candidateObservations.push(obs);

                        // Create Provenance Mapping
                        const prov = {
                            indicatorCode: source.code,
                            region: "VN",
                            observationDate: new Date(`${latestRecord.date}-12-31`),
                            sourceLabel: "World Bank API",
                            providerType: "candidate",
                            dataMode: "candidate_macro_data",
                            productionApproved: false,
                            needsReview: true,
                            sourceUrl: source.url,
                            retrievedAt: new Date(),
                            warningCodes: JSON.stringify(["UNVERIFIED_SOURCE", "PREVIEW_ONLY"]),
                            evidenceNotes: `World Bank API fetch for ${source.code}`
                        };
                        candidateProvenances.push(prov);

                        // Update counters
                        summary.candidateMacroIndicators++;
                        summary.candidateMacroObservations++;
                        summary.candidateMacroProvenanceRows++;

                        if (obs.productionApproved || prov.productionApproved) {
                            summary.productionApprovedTrueCount++;
                        }
                        if (obs.needsReview) summary.needsReviewTrueCount++;
                        if (prov.needsReview) summary.needsReviewTrueCount++;
                        
                        const wCodes = ["UNVERIFIED_SOURCE", "PREVIEW_ONLY"];
                        wCodes.forEach(c => {
                            summary.warningCodeCounts[c] = (summary.warningCodeCounts[c] || 0) + 1;
                        });
                    }
                }
            } catch (e: any) {
                summary.previewBlocked = true;
                const errReason = e.message || String(e);
                summary.previewBlockedReasons.push(errReason);
            }
        }

        if (summary.previewBlockedReasons.length === 0) {
            summary.providerFetchSucceeded = true;
        }

        if (candidateObservations.length > 0 && summary.schemaModelsAvailable) {
            summary.candidateRowsValidForSchema = true;
        }

        if (summary.candidateRowsValidForSchema && !summary.previewBlocked) {
            summary.smokePassed = true;
            summary.readyForMacroConfirmWritePhase = true;
        }

        console.log("\n--- Macro Ingestion to Schema Preview Summary ---");
        for (const [key, value] of Object.entries(summary)) {
            if (key === 'warningCodeCounts') {
                console.log(`${key}: ${Object.entries(value as object).map(([k,v]) => `${k}:${v}`).join(', ')}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

        if (candidateObservations.length > 0) {
            console.log("\nSample Candidate Observation Row (Memory Only):");
            console.log(JSON.stringify(candidateObservations[0], null, 2));

            console.log("\nSample Candidate Provenance Row (Memory Only):");
            console.log(JSON.stringify(candidateProvenances[0], null, 2));
        }

    } catch (error: any) {
        console.error("\nPreview failed catastrophically:", error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
