import fs from "node:fs";

async function smokeProduction() {
  const baseUrl = "http://localhost:3460";
  const tickers = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];
  const matrix: Array<Record<string, unknown>> = [];
  let hasError = false;

  console.log("SMOKING WORKSPACE ROUTES...");
  const routes = [
    "/",
    "/workspace",
    "/workspace?ticker=FPT",
    "/workspace?ticker=MWG",
    "/workspace?ticker=VCB",
    "/workspace?ticker=MWG&module=financials",
    "/workspace?ticker=MWG&module=risk",
    "/workspace?ticker=VCB&module=risk",
  ];
  for (const route of routes) {
    const res = await fetch(`${baseUrl}${route}`);
    console.log(`[GET] ${route} -> ${res.status}`);
    if (res.status >= 500) {
      console.error(`ERROR on route ${route}`);
      hasError = true;
    }
  }

  console.log("\nSMOKING API ROUTES...");
  for (const ticker of tickers) {
    const res = await fetch(`${baseUrl}/api/companies/${ticker}/financials`);
    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (status >= 500) {
      console.error(`ERROR on API ${ticker} -> ${status}`);
      hasError = true;
      continue;
    }

    const payload = data?.data?.[0];
    const sourceLabel = payload?.sourceLabel ?? "unknown";
    const eps = payload?.eps;
    const sharesOutstanding = payload?.sharesOutstanding;
    const totalDebt = payload?.totalDebt;
    const productionApproved = payload?.productionApproved ?? false;
    
    matrix.push({
      ticker,
      source: sourceLabel,
      eps,
      sharesOutstanding,
      totalDebt,
      productionApproved
    });

    console.log(`[API] ${ticker} -> ${sourceLabel} | EPS: ${eps} | Shares: ${sharesOutstanding} | Debt: ${totalDebt} | ProdAppr: ${productionApproved}`);
  }

  console.log("\nSMOKING ASSISTANT API...");
  const payloadMWG = {
    question: "Chỉ số tài chính là gì?",
    messages: [{ role: "user", content: "Chỉ số tài chính là gì?" }],
    context: { ticker: "MWG", activeModule: "financials" }
  };
  const resAssistant = await fetch(`${baseUrl}/api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloadMWG)
  });
  console.log(`[POST] /api/assistant (MWG) -> ${resAssistant.status}`);
  const dataAssistant = await resAssistant.json();
  console.log(`Assistant Status: ${dataAssistant?.llmStatus} | Message: ${dataAssistant?.message}`);

  fs.writeFileSync(
    "docs/product/evidence/PHASE141D_DEPLOYMENT_READINESS_PRODUCTION_MODE_SMOKE_AUDIT_RESULT.json",
    JSON.stringify({ matrix, assistant: dataAssistant }, null, 2)
  );

  if (hasError) {
    process.exit(1);
  }
}

smokeProduction().catch(err => {
  console.error(err);
  process.exit(1);
});
