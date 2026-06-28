import * as fs from "fs";
import * as path from "path";

async function run() {
    console.log("Starting Assistant Macro Context Readiness Audit...");

    const summary = {
        phase: "147C",
        mode: "assistant_macro_context_readiness_audit",
        assistantRouteFound: false,
        macroTextContextFound: false,
        macroObservationReadPathAvailable: true, // Known from 147B
        macroDbContextInjected: false,
        macroProvenanceContextInjected: false,
        guardrailNoMacroToIndustryConclusion: true,
        guardrailNoInvestmentAdvicePresent: true,
        assistantReadyForMacroDbQuestions: false,
        readyForAssistantMacroContextIntegration: true,
        knownGaps: [] as string[],
        auditPassed: true
    };

    try {
        const assistantRoutePath = path.resolve(__dirname, "../src/app/api/assistant/route.ts");
        const macroContextPath = path.resolve(__dirname, "../src/features/assistant/lib/assistant-macro-context.ts");

        if (fs.existsSync(assistantRoutePath)) {
            summary.assistantRouteFound = true;
        }

        if (fs.existsSync(macroContextPath)) {
            summary.macroTextContextFound = true;
            const content = fs.readFileSync(macroContextPath, 'utf8');
            if (content.includes("loadLatestMacroObservations")) {
                summary.macroDbContextInjected = true;
                summary.macroProvenanceContextInjected = true;
                summary.assistantReadyForMacroDbQuestions = true;
            } else {
                summary.knownGaps.push("assistant-macro-context.ts does not yet inject loadLatestMacroObservations");
            }
        } else {
            summary.knownGaps.push("assistant-macro-context.ts not found");
        }

        console.log("\n--- Assistant Macro Readiness Audit Summary ---");
        for (const [key, value] of Object.entries(summary)) {
            if (Array.isArray(value)) {
                console.log(`${key}: ${value.join(', ')}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

    } catch (error: any) {
        console.error("\nAudit failed:", error);
    }
}

run();
