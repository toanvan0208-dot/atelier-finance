import fs from "fs";
import path from "path";

interface CsvRow {
  period: string;
  period_type: string;
  foreign_net_flow_value: string;
  unit: string;
  value_type: string;
  definition: string;
  scope: string;
  market: string;
  source_name: string;
  source_url: string;
  publication_date: string;
  extracted_quote: string;
  notes: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  const records: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma ignoring commas inside quotes
    const values: string[] = [];
    let inQuote = false;
    let currentValue = "";
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
    });
    records.push(row as CsvRow);
  }
  return records;
}

function runDryRun() {
  console.log("Starting Phase 149N: FOREIGN_NET_FLOW Manual CSV Dry-Run...\n");

  const results = {
    dbWriteAttempted: false,
    candidateRowsGenerated: 0,
    blockedRows: 0,
    readyForConfirmWrite: false,
    productionApprovedTrueCount: 0,
    needsReviewCount: 0,
    periodRange: { min: "9999-99", max: "0000-00" },
    duplicatePeriodCount: 0,
    positiveNetBuyingRows: 0,
    negativeNetSellingRows: 0,
    exactArticleUrlCount: 0,
    genericSourceUrlCount: 0,
    needsSourceReviewCount: 0,
    caveatSummary: [] as string[],
  };

  const csvPath = path.join(process.cwd(), "data/manual-review/macro/foreign-net-flow/vietnam-foreign-net-flow-manual.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const records = parseCsv(fileContent);

  const seenPeriods = new Set<string>();
  let hasErrors = false;

  for (const [index, row] of records.entries()) {
    const rowNum = index + 2; // +1 for 0-index, +1 for header

    if (!row.period || !row.period.match(/^\d{4}-\d{2}$/)) {
      console.error(`Row ${rowNum}: Invalid or missing period format (YYYY-MM). Got: ${row.period}`);
      hasErrors = true;
    }

    if (row.period_type !== "monthly") {
      console.error(`Row ${rowNum}: period_type must be 'monthly'. Got: ${row.period_type}`);
      hasErrors = true;
    }

    if (row.unit !== "billion_vnd") {
      console.error(`Row ${rowNum}: unit must be 'billion_vnd'. Got: ${row.unit}`);
      hasErrors = true;
    }

    if (row.value_type !== "net_value") {
      console.error(`Row ${rowNum}: value_type must be 'net_value'. Got: ${row.value_type}`);
      hasErrors = true;
    }

    if (row.market !== "HOSE" && row.market !== "ALL_MARKET") {
      console.error(`Row ${rowNum}: market must be 'HOSE' or 'ALL_MARKET'. Got: ${row.market}`);
      hasErrors = true;
    }

    if (!row.source_name || !row.source_url || !row.extracted_quote || !row.notes) {
      console.error(`Row ${rowNum}: source_name, source_url, extracted_quote, notes cannot be empty.`);
      hasErrors = true;
    }

    const value = parseFloat(row.foreign_net_flow_value);
    if (isNaN(value)) {
      console.error(`Row ${rowNum}: foreign_net_flow_value must be a number. Got: ${row.foreign_net_flow_value}`);
      hasErrors = true;
    }

    if (value === 0 && row.notes.toLowerCase().includes("missing")) {
      console.error(`Row ${rowNum}: Zero-fill is not allowed for missing data.`);
      hasErrors = true;
    }

    if (!hasErrors) {
      if (seenPeriods.has(row.period)) {
        results.duplicatePeriodCount++;
        console.error(`Row ${rowNum}: Duplicate period found: ${row.period}`);
        hasErrors = true;
      }
      seenPeriods.add(row.period);

      results.candidateRowsGenerated++;
      results.needsReviewCount++; // Enforced to be true

      if (row.period < results.periodRange.min) results.periodRange.min = row.period;
      if (row.period > results.periodRange.max) results.periodRange.max = row.period;

      if (value > 0) results.positiveNetBuyingRows++;
      else if (value < 0) results.negativeNetSellingRows++;

      if (row.notes.includes("publisher homepage") || row.notes.includes("publisher stat page")) {
        results.genericSourceUrlCount++;
        results.needsSourceReviewCount++;
      } else {
        results.exactArticleUrlCount++;
      }
    } else {
      results.blockedRows++;
    }
  }

  if (results.candidateRowsGenerated === 0) {
    results.periodRange.min = "";
    results.periodRange.max = "";
  }

  results.caveatSummary.push("Needs Review: True");
  results.caveatSummary.push("Production Approved: False");
  results.caveatSummary.push("Source Type: manual_aggregated_foreign_net_flow_candidate");
  if (results.genericSourceUrlCount > 0) {
    results.caveatSummary.push("Some rows use generic publisher homepage/stat page URLs and require exact article URL review.");
  }

  results.readyForConfirmWrite = !hasErrors && results.candidateRowsGenerated > 0;

  console.log("\n--- DRY RUN RESULTS ---");
  console.log(JSON.stringify(results, null, 2));

  if (hasErrors) {
    console.error("\nValidation failed for some rows. Please review errors.");
    process.exit(1);
  } else {
    console.log("\nValidation passed. Ready for confirm write.");
  }
}

runDryRun();
