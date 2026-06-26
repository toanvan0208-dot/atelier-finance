import { prisma } from "../src/lib/database/client";
import { fetchLocalPythonVnstockHistory, normalizeVnstockHistoryResponse, VNSTOCK_RESEARCH_SOURCE_LABEL } from "../src/lib/data-sources/vnstock-market-pvt-controlled-ingestion";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const SOURCE_LABEL = VNSTOCK_RESEARCH_SOURCE_LABEL;

async function main() {
  const isConfirmWrite = process.argv.includes("--confirm-write");

  // Validate environment
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("supabase")) {
    console.error("ERROR: DATABASE_URL must point to Supabase staging.");
    process.exit(1);
  }

  console.log("=== Staging Market Price PVT Seed ===");
  console.log(`writeEnabled: ${isConfirmWrite}`);
  console.log(`confirmWrite: ${isConfirmWrite}`);
  console.log(`DB write: ${isConfirmWrite ? "Yes" : "No"}`);
  console.log(`approved tickers: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`sourceLabel: ${SOURCE_LABEL}`);

  let dataSource = await prisma.dataSource.findFirst({ where: { name: SOURCE_LABEL } });
  if (!dataSource) {
    if (isConfirmWrite) {
      dataSource = await prisma.dataSource.create({
        data: {
          name: SOURCE_LABEL,
          sourceType: "user_input",
        }
      });
      console.log(`Created DataSource: ${SOURCE_LABEL}`);
    } else {
      console.log(`[Dry Run] Would create DataSource: ${SOURCE_LABEL}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dataSource = { id: "dry-run-source-id", name: SOURCE_LABEL } as any;
    }
  }

  let totalWritten = 0;
  for (const ticker of APPROVED_TICKERS) {
    const request = { ticker, from: "2025-01-01", to: "2025-01-31" };
    const rawRows = await fetchLocalPythonVnstockHistory(request);
    const normalized = normalizeVnstockHistoryResponse(request, rawRows);
    
    const company = await prisma.company.findFirst({ where: { ticker } });
    if (!company) {
      console.log(`Company not found for ${ticker}, skipping.`);
      continue;
    }

    let writtenForTicker = 0;
    for (const obs of normalized.observations) {
      const dataMode = "research_only";
      
      if (isConfirmWrite) {
        const existing = await prisma.marketPrice.findFirst({
          where: {
            companyId: company.id,
            tradingDate: new Date(obs.tradingDate + "T00:00:00.000Z"),
          }
        });
        
        if (existing) {
          await prisma.marketPrice.update({
            where: { id: existing.id },
            data: {
              closePrice: obs.closePrice,
              volume: obs.volume,
              dataMode,
              sourceId: dataSource!.id,
              sourceLabel: SOURCE_LABEL,
              sourceType: "user_input",
              asOf: new Date(normalized.asOf + "T00:00:00.000Z"),
              currency: normalized.currency,
            }
          });
        } else {
          await prisma.marketPrice.create({
            data: {
              companyId: company.id,
              ticker: ticker,
              tradingDate: new Date(obs.tradingDate + "T00:00:00.000Z"),
              periodType: "day",
              period: obs.tradingDate,
              closePrice: obs.closePrice,
              volume: obs.volume,
              dataMode,
              sourceId: dataSource!.id,
              sourceLabel: SOURCE_LABEL,
              sourceType: "user_input",
              asOf: new Date(normalized.asOf + "T00:00:00.000Z"),
              currency: normalized.currency,
            }
          });
        }
        writtenForTicker++;
      } else {
        writtenForTicker++;
      }
    }
    
    console.log(`[${isConfirmWrite ? "WRITE" : "DRY RUN"}] Ticker ${ticker}: ${writtenForTicker} rows processed.`);
    totalWritten += writtenForTicker;
  }

  console.log(`\nTotal rows processed: ${totalWritten}`);
  if (isConfirmWrite) {
    console.log("Successfully seeded staging database.");
  } else {
    console.log("Dry run successful. Use --confirm-write to execute.");
  }
}

main().catch(console.error);
