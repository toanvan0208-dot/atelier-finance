import https from "https";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/database/client.js";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^FRED_API_KEY=(.+)$/);
    if (match) process.env.FRED_API_KEY = match[1].trim();
  }
}

const FRED_API_KEY = process.env.FRED_API_KEY;

const isConfirmWrite = process.argv.includes("--confirm-write");

type CandidateRow = {
  indicatorCode: string;
  seriesId: string;
  observationDate: string;
  value: number | null;
  unit: string;
  region: string;
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
    indicatorName: "Federal Funds Effective Rate",
    seriesId: "FEDFUNDS",
    unit: "percent",
    region: "US",
    semanticProxyRisk: false
  },
  {
    indicatorCode: "DXY",
    indicatorName: "Sức mạnh USD",
    seriesId: "DTWEXBGS",
    unit: "index",
    region: "GLOBAL",
    semanticProxyRisk: true,
    notOfficialDxy: true,
    uiLabel: "Sức mạnh USD"
  },
  {
    indicatorCode: "BRENT_OIL_PRICE",
    indicatorName: "Brent Crude Oil Price",
    seriesId: "DCOILBRENTEU",
    unit: "usd_per_barrel",
    region: "GLOBAL",
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

async function runScript() {
  console.log(`Starting FRED API Key Guarded Script (Confirm Write: ${isConfirmWrite})\n`);

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
    isConfirmWrite,
    dbWriteAttempted: isConfirmWrite,
    targetCandidateRows: 0,
    writtenObservationRows: 0,
    writtenProvenanceRows: 0,
    productionApprovedTrueCount: 0,
    needsReviewTrueCount: 0,
    rowsAlreadyExist: 0,
    candidates: []
  };

  // prisma is imported above
  // no need to connect, pg handles it

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
          region: mapping.region,
          sourceName: "FRED",
          sourceUrl: `https://fred.stlouisfed.org/series/${mapping.seriesId}`,
          sourceType: "fred_api",
          dataMode: "fred_api_candidate",
          needsReview: true,
          productionApproved: false,
          semanticProxyRisk: mapping.semanticProxyRisk,
          notOfficialDxy: mapping.notOfficialDxy,
          uiLabel: mapping.uiLabel,
          parserStatus: val === null ? "missing_value" : "success"
        };
      });

      results.targetCandidateRows += rows.length;

      if (isConfirmWrite && prisma) {
        // Upsert Indicator
        let indicator = await prisma.macroIndicator.findUnique({
          where: { indicatorCode: mapping.indicatorCode }
        });

        if (!indicator) {
          indicator = await prisma.macroIndicator.create({
            data: {
              indicatorCode: mapping.indicatorCode,
              indicatorName: mapping.indicatorName,
              defaultUnit: mapping.unit,
              regionScope: mapping.region,
              sourceLabel: "FRED"
            }
          });
        }

        for (const row of rows) {
          if (row.value === null) {
            continue; // Skip missing data
          }

          const obsDate = new Date(row.observationDate);

          // Check if exists
          const existingObs = await prisma.macroObservation.findUnique({
            where: {
              indicatorCode_region_observationDate_sourceLabel: {
                indicatorCode: row.indicatorCode,
                region: row.region,
                observationDate: obsDate,
                sourceLabel: "FRED"
              }
            }
          });

          if (existingObs) {
            results.rowsAlreadyExist++;
          } else {
            await prisma.macroObservation.create({
              data: {
                indicatorId: indicator.id,
                indicatorCode: row.indicatorCode,
                region: row.region,
                observationDate: obsDate,
                value: row.value,
                unit: row.unit,
                sourceLabel: "FRED",
                dataMode: row.dataMode,
                productionApproved: row.productionApproved,
                needsReview: row.needsReview
              }
            });
            results.writtenObservationRows++;
            results.needsReviewTrueCount++;
            if (row.productionApproved) {
              results.productionApprovedTrueCount++;
            }
          }

          const existingProv = await prisma.macroObservationProvenance.findUnique({
            where: {
              indicatorCode_region_observationDate_sourceLabel: {
                indicatorCode: row.indicatorCode,
                region: row.region,
                observationDate: obsDate,
                sourceLabel: "FRED"
              }
            }
          });

          if (!existingProv) {
            await prisma.macroObservationProvenance.create({
              data: {
                indicatorCode: row.indicatorCode,
                region: row.region,
                observationDate: obsDate,
                sourceLabel: "FRED",
                providerType: row.sourceType,
                dataMode: row.dataMode,
                productionApproved: row.productionApproved,
                needsReview: row.needsReview,
                sourceUrl: row.sourceUrl
              }
            });
            results.writtenProvenanceRows++;
          }
        }
      }

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

  // no need to disconnect since pg pool handles it

  console.log("\n--- OUTPUT JSON ---");
  console.log(JSON.stringify(results, null, 2));
}

runScript().catch(async (err) => {
  console.error("Fatal error during script execution:", err);
  process.exit(1);
});
