import { buildAssistantPrompt } from "../src/lib/ai-rag/prompts/build-assistant-prompt";
import { loadLatestMacroObservations } from "../src/features/macro/lib/macro-observation-read-path";
import { prisma } from "../src/lib/database/client";

async function run() {
  console.log("=== Assistant Macro Context Smoke Test ===");
  try {
    const macroContext = await loadLatestMacroObservations({
      indicatorCodes: ["CPI_YOY", "GDP_GROWTH"]
    });

    const result = buildAssistantPrompt({
      activeModule: "macro",
      userQuestion: "Tình hình lạm phát hiện tại ra sao?",
      moduleContext: {
        macroContext
      }
    });

    console.log("PROMPT TEXT:", result.promptText);

    console.log("Prompt includes macroContext:", result.promptText.includes("macroContext"));
    console.log("Prompt includes CPI_YOY:", result.promptText.includes("CPI_YOY"));
    console.log("Prompt includes GDP_GROWTH:", result.promptText.includes("GDP_GROWTH"));

    if (result.promptText.includes("CPI_YOY") && result.promptText.includes("GDP_GROWTH")) {
      console.log("SUCCESS: Assistant macro context correctly injected into prompt.");
      process.exit(0);
    } else {
      console.log("FAILED: Assistant prompt does not contain injected macro context.");
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
