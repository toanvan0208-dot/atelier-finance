import https from "https";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^FRED_API_KEY=(.+)$/);
    if (match) process.env.FRED_API_KEY = match[1].trim();
  }
}

const FRED_API_KEY = process.env.FRED_API_KEY;

type CandidateRow = {
  indicatorCode: string;
  seriesId: string;
  observationDate: string;
  value: number | null;
  unit: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  dataMode: string;
  needsReview: boolean;
  productionApproved: boolean;
  semanticProxyRisk: boolean;
  notOfficialDxy?: boolean;
  uiLabel?: string;
  parserStatus: string;
};

const SERIES_MAPPING = [
  {
    indicatorCode: "FED_FUNDS_RATE",
    seriesId: "FEDFUNDS",
    unit: "%",
    semanticProxyRisk: false
  },
  {
    indicatorCode: "DXY",
    seriesId: "DTWEXBGS",
    unit: "Index",
    semanticProxyRisk: true,
    notOfficialDxy: true,
    uiLabel: "Sức mạnh USD"
  },
  {
    indicatorCode: "BRENT_OIL_PRICE",
    seriesId: "DCOILBRENTEU",
    unit: "USD/Barrel",
    semanticProxyRisk: false
  }
];

function fetchFredSeries(seriesId: string, apiKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function runDryRun() {
  console.log("Starting FRED API Key Guarded Dry-Run\n");

  if (!FRED_API_KEY) {
    console.log(JSON.stringify({
      error: "missing_env_key",
      message: "FRED_API_KEY is not set in the environment. Failing closed.",
      hasFredApiKey: false
    }, null, 2));
    process.exit(1);
    return;
  }

  console.log("hasFredApiKey=true\n");

  const results: any = {
    hasFredApiKey: true,
    candidates: []
  };

  for (const mapping of SERIES_MAPPING) {
    console.log(`Fetching series: ${mapping.seriesId} for indicator: ${mapping.indicatorCode}...`);
    try {
      const data = await fetchFredSeries(mapping.seriesId, FRED_API_KEY);
      
      const observations = data.observations || [];
      
      const rows: CandidateRow[] = observations.map((obs: any) => {
        const val = obs.value === "." ? null : parseFloat(obs.value);
        return {
          indicatorCode: mapping.indicatorCode,
          seriesId: mapping.seriesId,
          observationDate: obs.date,
          value: val,
          unit: mapping.unit,
          sourceName: "FRED",
          sourceUrl: `https://fred.stlouisfed.org/series/${mapping.seriesId}`,
          sourceType: "public_api_candidate",
          dataMode: "candidate_provider_data",
          needsReview: true,
          productionApproved: false,
          semanticProxyRisk: mapping.semanticProxyRisk,
          notOfficialDxy: mapping.notOfficialDxy,
          uiLabel: mapping.uiLabel,
          parserStatus: val === null ? "missing_value" : "success"
        };
      });

      results.candidates.push({
        indicatorCode: mapping.indicatorCode,
        status: "success",
        rows
      });

    } catch (err: any) {
      console.log(`Failed to fetch ${mapping.seriesId}: ${err.message}`);
      results.candidates.push({
        indicatorCode: mapping.indicatorCode,
        status: "error",
        error: err.message
      });
    }
  }

  console.log("\n--- DRY-RUN OUTPUT JSON ---");
  console.log(JSON.stringify(results, null, 2));
}

runDryRun().catch(err => {
  console.error("Fatal error during dry run:", err);
  process.exit(1);
});
