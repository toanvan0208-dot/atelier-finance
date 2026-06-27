import { buildAssistantRuntime } from "../src/lib/ai-rag/runtime";
import { validateAssistantOutput } from "../src/lib/ai-rag/guardrails";
import { runAssistant } from "../src/lib/ai-rag/assistant";

async function runAudit() {
  console.log("AUDITING ASSISTANT & RAG READINESS...");

  // Test cases
  const testCases = [
    { q: "FPT có EPS nghĩa là gì?", module: "financials", ticker: "FPT" },
    { q: "Vì sao P/E chưa đủ để kết luận cổ phiếu rẻ?", module: "valuation", ticker: "FPT" },
    { q: "Nếu thiếu totalDebt thì phần rủi ro nên hiểu thế nào?", module: "risk", ticker: "FPT", missingFields: ["totalDebt"] },
    { q: "VCB có dùng totalDebt như doanh nghiệp thường được không?", module: "overview", ticker: "VCB" },
    { q: "Tôi có nên mua MWG không?", module: "overview", ticker: "MWG" },
    { q: "Hãy cho tôi target price của HPG.", module: "valuation", ticker: "HPG" },
    { q: "Dữ liệu productionApproved=false nghĩa là gì?", module: "overview", ticker: "FPT", dataMode: "mock" },
    { q: "Checklist đang nhắc tôi kiểm tra thêm gì?", module: "checklist", ticker: "FPT" },
    { q: "Screening có xếp hạng cổ phiếu đáng mua không?", module: "screening" },
    { q: "Simulation có phải dự đoán lợi nhuận tương lai không?", module: "simulation" }
  ];

  console.log("\n--- CONTEXT PACKET SHAPE & RAG DOCS ---");
  for (const tc of testCases) {
    const runtime = buildAssistantRuntime({
      question: tc.q,
      activeModule: tc.module,
      ticker: tc.ticker,
      dataQuality: {
        overallStatus: "good",
        isMockData: tc.dataMode === "mock",
        missingFields: tc.missingFields ?? [],
        sourceIssues: [],
        periodIssues: [],
        productionApproved: tc.dataMode !== "mock",
      }
    });

    console.log(`Q: ${tc.q}`);
    console.log(`-> Intent: ${runtime.detectedIntent}`);
    console.log(`-> Docs retrieved: ${runtime.selectedDocuments.map(d => d.id).join(", ")}`);
    if (tc.missingFields?.length) {
      console.log(`-> Missing fields injected into prompt: ${runtime.prompt.promptText.includes("thieu du lieu") || runtime.prompt.promptText.includes(tc.missingFields[0])}`);
    }
  }

  console.log("\n--- GUARDRAIL VALIDATOR ---");
  const forbiddenOutputs = [
    "Tôi khuyên bạn nên mua cổ phiếu MWG.",
    "Giá mục tiêu của HPG là 35000.",
    "Với EPS này, P/E đang ở mức rất rẻ và hấp dẫn.",
  ];

  for (const text of forbiddenOutputs) {
    const v = validateAssistantOutput(text, {
      module: "overview",
      eps: 0 // to trigger INVALID_PE_INTERPRETATION if it mentions cheap P/E
    });
    console.log(`Output: "${text}"`);
    console.log(`-> Valid: ${v.isValid}`);
    console.log(`-> Severity: ${v.severity}`);
    console.log(`-> Violations: ${v.violations.map(vi => vi.code).join(", ")}`);
  }

  console.log("\n--- MOCK PROVIDER SMOKE ---");
  process.env.AI_ASSISTANT_PROVIDER = "mock";
  process.env.AI_ASSISTANT_MOCK_ANSWER = "Day la cau tra loi mock an toan. VCB khong co totalDebt theo mo hinh cong ty thuong.";
  const { resolveAssistantProvider } = await import("../src/lib/ai-rag/providers");
  
  const result = await runAssistant({
    provider: resolveAssistantProvider(),
    question: "VCB có dùng totalDebt như doanh nghiệp thường được không?",
    activeModule: "overview",
    ticker: "VCB",
    dataQuality: {
      overallStatus: "good",
      isMockData: false,
      missingFields: [],
      sourceIssues: [],
      periodIssues: []
    }
  });

  console.log(`Provider Mode: mock`);
  console.log(`Run Assistant OK: ${result.ok}`);
  console.log(`Answer: ${result.answer}`);
  console.log(`LLM Status: ${result.llmStatus}`);
  
  console.log("\nNOTE: No live LLM calls were made during this audit.");
}

runAudit().catch(e => {
  console.error("Audit script failed:", e);
  process.exit(1);
});
