import { describe, expect, it } from "vitest";
import { buildAssistantPrompt } from "../build-assistant-prompt";
import type { BuildAssistantPromptInput } from "../types";

const baseInput = (overrides: Partial<BuildAssistantPromptInput>): BuildAssistantPromptInput => ({
  userQuestion: "Explain this screen.",
  activeModule: "general",
  moduleContext: {
    moduleKey: "general",
    moduleName: "General",
    metrics: {},
    missingFields: [],
  },
  dataQuality: {
    overallStatus: "good",
    isMockData: false,
    missingFields: [],
  },
  retrievedChunks: [],
  ...overrides,
});

describe("buildAssistantPrompt", () => {
  it("builds PVT prompt with PVT guardrails", () => {
    const result = buildAssistantPrompt(
      baseInput({
        activeModule: "technical",
        userQuestion: "Volume tang manh co phai tin hieu mua khong?",
      }),
    );

    expect(result.promptText).toContain("PVT is market observation, not a trading signal.");
    expect(result.promptText).toContain("Do not call price or volume an entry signal");
    expect(result.promptText).toContain("Never predict price direction.");
  });

  it("builds financials prompt with missing data rules", () => {
    const result = buildAssistantPrompt(
      baseInput({
        activeModule: "financials",
        moduleContext: {
          moduleKey: "financials",
          moduleName: "Financial statements",
          metrics: { revenue: 100, operatingCashFlow: null },
          missingFields: ["operatingCashFlow"],
        },
        dataQuality: {
          overallStatus: "partial",
          isMockData: false,
          missingFields: ["operatingCashFlow", "inventory"],
        },
      }),
    );

    expect(result.promptText).toContain("Missing data must be represented as null/not_available/insufficient_data");
    expect(result.promptText).toContain("operatingCashFlow");
    expect(result.promptText).toContain("inventory");
    expect(result.promptText).toContain("If a required field is missing, do not infer it and do not fill it with zero.");
  });

  it("builds valuation prompt with fair value limitation", () => {
    const result = buildAssistantPrompt(
      baseInput({
        activeModule: "valuation",
        userQuestion: "Fair value la bao nhieu?",
      }),
    );

    expect(result.promptText).toContain("Do not create fair value or target price unless provided in context.");
    expect(result.promptText).toContain("EPS less than or equal to zero");
    expect(result.promptText).toContain("Equity or BVPS less than or equal to zero");
  });

  it("builds risk prompt with risk score limitation", () => {
    const result = buildAssistantPrompt(
      baseInput({
        activeModule: "risk",
        userQuestion: "Risk score thap thi an toan khong?",
      }),
    );

    expect(result.promptText).toContain("Risk score is not a final safe/bad stock conclusion.");
    expect(result.promptText).toContain("Do not say low risk means the stock is safe.");
  });

  it("builds checklist prompt with checklist limitation", () => {
    const result = buildAssistantPrompt(
      baseInput({
        activeModule: "checklist",
        userQuestion: "Checklist dat nhieu muc thi sao?",
      }),
    );

    expect(result.promptText).toContain("Checklist is not an investment recommendation.");
    expect(result.promptText).toContain("Do not say passing a checklist means the stock should be bought or held.");
  });

  it("does not pretend RAG context exists when retrieved chunks are missing", () => {
    const result = buildAssistantPrompt(baseInput({ retrievedChunks: [] }));

    expect(result.hasRagContext).toBe(false);
    expect(result.promptText).toContain("RAG context: not_available");
    expect(result.promptText).toContain("Do not pretend RAG context exists.");
  });

  it("includes source and chunk id when retrieved chunks exist", () => {
    const result = buildAssistantPrompt(
      baseInput({
        retrievedChunks: [
          {
            chunkId: "rag_pvt_001",
            documentId: "RAG_PVT_KNOWLEDGE",
            filePath: "docs/rag/RAG_PVT_KNOWLEDGE.md",
            title: "PVT basics",
            sectionPath: ["Price Volume Time", "Liquidity"],
            text: "PVT explains price, volume, trading value, and liquidity.",
            score: 0.91,
            sectionType: "concept_explanation",
          },
        ],
      }),
    );

    expect(result.hasRagContext).toBe(true);
    expect(result.usedChunkIds).toEqual(["rag_pvt_001"]);
    expect(result.promptText).toContain("chunkId: rag_pvt_001");
    expect(result.promptText).toContain("filePath: docs/rag/RAG_PVT_KNOWLEDGE.md");
  });

  it("does not contain an instruction that permits buy/sell/hold", () => {
    const result = buildAssistantPrompt(baseInput({}));
    const normalizedPrompt = result.promptText.toLowerCase();

    expect(normalizedPrompt).not.toMatch(/allow(s|ed)?\s+(buy|sell|hold)/);
    expect(normalizedPrompt).not.toMatch(/permit(s|ted)?\s+(buy|sell|hold)/);
    expect(normalizedPrompt).not.toMatch(/can\s+recommend\s+(buy|sell|hold)/);
    expect(normalizedPrompt).toContain("never recommend buy/sell/hold");
  });
});
