import { spawn } from "child_process";
import http from "http";

const TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"];
const MODULES = ["overview", "macro", "industry", "business", "financials", "valuation", "risk"];
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const fetchRoute = (url: string): Promise<{ status: number; text: string }> => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode || 500, text: data });
      });
    }).on("error", (err) => reject(err));
  });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkServerReady = async (): Promise<boolean> => {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetchRoute(BASE_URL);
      if (res.status === 200 || res.status === 404) return true;
    } catch {
      // ignore
    }
    await delay(1000);
  }
  return false;
};

const runSmoke = async () => {
  console.log("Starting Next.js server with staging PostgreSQL...");
  const env = { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" };
  const serverProcess = spawn("node", ["scripts/run-staging.mjs", "npm", "start"], {
    stdio: "pipe",
    env,
    shell: process.platform === "win32"
  });

  serverProcess.stdout.on("data", (data) => console.log(`[Next.js] ${data.toString().trim()}`));
  serverProcess.stderr.on("data", (data) => console.error(`[Next.js Error] ${data.toString().trim()}`));

  const isReady = await checkServerReady();
  if (!isReady) {
    console.error("Server failed to start within 30 seconds.");
    serverProcess.kill();
    process.exit(1);
  }

  console.log("Server is ready. Starting cross-module UI/SSR smoke test...\n");

  let hasError = false;

  for (const ticker of TICKERS) {
    console.log(`--- Ticker: ${ticker} ---`);
    for (const mod of MODULES) {
      const url = `${BASE_URL}/workspace?symbol=${ticker}&module=${mod}`;
      try {
        const { status, text } = await fetchRoute(url);
        
        let observation = `HTTP ${status}`;
        if (status !== 200) {
          observation += " ❌";
          hasError = true;
        } else {
          // Check for forbidden wording or Prisma errors
          const textLower = text.toLowerCase();
          if (textLower.includes("prisma error") || textLower.includes("invocation")) {
            observation += " - Prisma Error detected ❌";
            hasError = true;
          } else if (textLower.includes("đáng mua") || (textLower.includes("khuyến nghị") && !textLower.includes("không phải khuyến nghị"))) {
            observation += " - Forbidden wording detected ❌";
            hasError = true;
          } else {
            observation += " ✅";
          }
        }
        
        console.log(`[${mod}] ${url} -> ${observation}`);
      } catch (err) {
        console.error(`[${mod}] ${url} -> Failed to fetch: ${err} ❌`);
        hasError = true;
      }
    }
    console.log();
  }

  console.log("Killing server...");
  serverProcess.kill();

  if (hasError) {
    console.error("Smoke test failed. See logs above.");
    process.exit(1);
  } else {
    console.log("Smoke test passed successfully.");
    process.exit(0);
  }
};

runSmoke().catch(console.error);
