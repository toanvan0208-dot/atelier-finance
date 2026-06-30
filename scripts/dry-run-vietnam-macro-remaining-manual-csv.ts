import fs from "fs";
import path from "path";

// Generic CSV Parser ignoring commas inside quotes
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
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
    records.push(row);
  }
  return records;
}

function runDryRun() {
  console.log("Starting Phase 149O: Dry-run remaining Vietnam macro manual CSV files...\n");

  const results = {
    dbReadAttempted: false,
    dbWriteAttempted: false,
    totalCandidateRowsGenerated: 0,
    productionApprovedTrueCount: 0,
    needsReviewCount: 0,
    noZeroFillDetected: true,
    noPlaceholderAsReal: true,
    indicatorsReadyForConfirmWrite: [] as string[],
    blockedIndicators: [] as string[],
    perIndicatorSummary: {} as Record<string, unknown>
  };

  const parsePMI = () => {
    const csvPath = path.join(process.cwd(), "data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual.csv");
    const indResults = {
      candidateRowsGenerated: 0,
      periodRange: { min: "9999-99", max: "0000-00" },
      duplicatePeriodCount: 0,
      genericSourceUrlCount: 0,
      needsSourceReviewCount: 0,
      readyForConfirmWrite: false,
    };
    if (!fs.existsSync(csvPath)) {
      console.error(`Missing: ${csvPath}`);
      return { hasErrors: true, results: indResults };
    }
    const records = parseCsv(fs.readFileSync(csvPath, "utf-8"));
    const seenPeriods = new Set<string>();
    let hasErrors = false;

    for (const [index, row] of records.entries()) {
      const rowNum = index + 2;
      
      if (row.period_type !== "monthly") { console.error(`PMI Row ${rowNum}: period_type must be monthly`); hasErrors = true; }
      if (row.unit !== "index") { console.error(`PMI Row ${rowNum}: unit must be index`); hasErrors = true; }
      if (!row.pmi_value || isNaN(parseFloat(row.pmi_value))) { console.error(`PMI Row ${rowNum}: pmi_value must be number`); hasErrors = true; }
      if (!row.source_name || !row.source_url || !row.publication_date || !row.extracted_quote || !row.notes) {
        console.error(`PMI Row ${rowNum}: Source fields cannot be empty`); hasErrors = true;
      }
      if (row.pmi_value === "0" && row.notes.toLowerCase().includes("missing")) {
        console.error(`PMI Row ${rowNum}: Zero-fill detected`); results.noZeroFillDetected = false; hasErrors = true;
      }
      if (row.notes.toLowerCase().includes("placeholder") || row.notes.toLowerCase().includes("sample")) {
        console.error(`PMI Row ${rowNum}: Placeholder detected`); results.noPlaceholderAsReal = false; hasErrors = true;
      }

      if (seenPeriods.has(row.period)) { indResults.duplicatePeriodCount++; hasErrors = true; }
      seenPeriods.add(row.period);

      if (row.notes.toLowerCase().includes("needs review") || row.notes.toLowerCase().includes("homepage")) {
        indResults.needsSourceReviewCount++;
        indResults.genericSourceUrlCount++;
      }

      if (!hasErrors) {
        indResults.candidateRowsGenerated++;
        if (row.period < indResults.periodRange.min) indResults.periodRange.min = row.period;
        if (row.period > indResults.periodRange.max) indResults.periodRange.max = row.period;
      }
    }
    indResults.readyForConfirmWrite = !hasErrors && indResults.candidateRowsGenerated > 0;
    if (indResults.candidateRowsGenerated === 0) indResults.periodRange = { min: "", max: "" };
    return { hasErrors, results: indResults };
  };

  const parsePolicyRate = () => {
    const csvPath = path.join(process.cwd(), "data/manual-review/macro/policy-rate/vietnam-policy-rate-manual.csv");
    const indResults = {
      candidateRowsGenerated: 0,
      periodRange: { min: "9999-99", max: "0000-00" },
      duplicatePeriodCount: 0,
      monthlySnapshotRows: 0,
      carryForwardRows: 0,
      genericSourceUrlCount: 0,
      needsSourceReviewCount: 0,
      readyForConfirmWrite: false,
    };
    if (!fs.existsSync(csvPath)) {
      console.error(`Missing: ${csvPath}`);
      return { hasErrors: true, results: indResults };
    }
    const records = parseCsv(fs.readFileSync(csvPath, "utf-8"));
    const seenPeriods = new Set<string>();
    let hasErrors = false;

    for (const [index, row] of records.entries()) {
      const rowNum = index + 2;
      
      if (row.period_type !== "monthly_snapshot") { console.error(`POLICY Row ${rowNum}: period_type must be monthly_snapshot`); hasErrors = true; }
      if (row.unit !== "percent") { console.error(`POLICY Row ${rowNum}: unit must be percent`); hasErrors = true; }
      if (row.rate_name !== "refinancing_rate") { console.error(`POLICY Row ${rowNum}: rate_name must be refinancing_rate`); hasErrors = true; }
      if (!row.policy_rate_value || isNaN(parseFloat(row.policy_rate_value))) { console.error(`POLICY Row ${rowNum}: policy_rate_value must be number`); hasErrors = true; }
      if (!row.source_name || !row.source_url || !row.publication_date || !row.extracted_quote || !row.notes) {
        console.error(`POLICY Row ${rowNum}: Source fields cannot be empty`); hasErrors = true;
      }
      
      const notesLower = row.notes.toLowerCase();
      if (!notesLower.includes("carry-forward") && !notesLower.includes("held constant") && !notesLower.includes("snapshot")) {
        console.error(`POLICY Row ${rowNum}: Notes must indicate monthly snapshot or carry-forward`); hasErrors = true;
      }

      if (row.policy_rate_value === "0" && notesLower.includes("missing")) {
        console.error(`POLICY Row ${rowNum}: Zero-fill detected`); results.noZeroFillDetected = false; hasErrors = true;
      }
      if (notesLower.includes("placeholder") || notesLower.includes("sample")) {
        console.error(`POLICY Row ${rowNum}: Placeholder detected`); results.noPlaceholderAsReal = false; hasErrors = true;
      }

      if (seenPeriods.has(row.period)) { indResults.duplicatePeriodCount++; hasErrors = true; }
      seenPeriods.add(row.period);

      if (notesLower.includes("needs review") || notesLower.includes("homepage")) {
        indResults.needsSourceReviewCount++;
        indResults.genericSourceUrlCount++;
      }

      if (!hasErrors) {
        indResults.candidateRowsGenerated++;
        indResults.monthlySnapshotRows++;
        if (notesLower.includes("carry-forward")) indResults.carryForwardRows++;

        if (row.period < indResults.periodRange.min) indResults.periodRange.min = row.period;
        if (row.period > indResults.periodRange.max) indResults.periodRange.max = row.period;
      }
    }
    indResults.readyForConfirmWrite = !hasErrors && indResults.candidateRowsGenerated > 0;
    if (indResults.candidateRowsGenerated === 0) indResults.periodRange = { min: "", max: "" };
    return { hasErrors, results: indResults };
  };

  const parseMarketTrading = () => {
    const csvPath = path.join(process.cwd(), "data/manual-review/macro/market-trading-value/vietnam-market-trading-value-manual.csv");
    const indResults = {
      candidateRowsGenerated: 0,
      periodRange: { min: "9999-99", max: "0000-00" },
      duplicatePeriodCount: 0,
      positiveTradingValueRows: 0,
      genericSourceUrlCount: 0,
      needsSourceReviewCount: 0,
      readyForConfirmWrite: false,
    };
    if (!fs.existsSync(csvPath)) {
      console.error(`Missing: ${csvPath}`);
      return { hasErrors: true, results: indResults };
    }
    const records = parseCsv(fs.readFileSync(csvPath, "utf-8"));
    const seenPeriods = new Set<string>();
    let hasErrors = false;

    for (const [index, row] of records.entries()) {
      const rowNum = index + 2;
      
      if (row.period_type !== "monthly") { console.error(`MARKET Row ${rowNum}: period_type must be monthly`); hasErrors = true; }
      if (row.unit !== "billion_vnd_per_session") { console.error(`MARKET Row ${rowNum}: unit must be billion_vnd_per_session`); hasErrors = true; }
      if (row.value_type !== "average_daily_trading_value") { console.error(`MARKET Row ${rowNum}: value_type must be average_daily_trading_value`); hasErrors = true; }
      if (row.market !== "HOSE") { console.error(`MARKET Row ${rowNum}: market must be HOSE`); hasErrors = true; }
      
      const val = parseFloat(row.trading_value);
      if (isNaN(val) || val <= 0) { console.error(`MARKET Row ${rowNum}: trading_value must be positive number`); hasErrors = true; }
      
      if (!row.source_name || !row.source_url || !row.publication_date || !row.extracted_quote || !row.notes) {
        console.error(`MARKET Row ${rowNum}: Source fields cannot be empty`); hasErrors = true;
      }
      
      const notesLower = row.notes.toLowerCase();
      const urlLower = row.source_url.toLowerCase();

      if (urlLower.includes("homepage") || urlLower.includes("stat.vn") || row.source_name.toLowerCase().includes("homepage")) {
        if (!notesLower.includes("exact article url needs review") && !notesLower.includes("review")) {
          console.error(`MARKET Row ${rowNum}: Generic URL must have caveat note 'exact article URL needs review'`); hasErrors = true;
        }
      }

      if (notesLower.includes("carry-forward") || notesLower.includes("placeholder")) {
        console.error(`MARKET Row ${rowNum}: Placeholder/carry-forward not allowed`); results.noPlaceholderAsReal = false; hasErrors = true;
      }

      if (seenPeriods.has(row.period)) { indResults.duplicatePeriodCount++; hasErrors = true; }
      seenPeriods.add(row.period);

      if (notesLower.includes("needs review") || notesLower.includes("homepage")) {
        indResults.needsSourceReviewCount++;
        indResults.genericSourceUrlCount++;
      }

      if (!hasErrors) {
        indResults.candidateRowsGenerated++;
        if (val > 0) indResults.positiveTradingValueRows++;
        
        if (row.period < indResults.periodRange.min) indResults.periodRange.min = row.period;
        if (row.period > indResults.periodRange.max) indResults.periodRange.max = row.period;
      }
    }
    indResults.readyForConfirmWrite = !hasErrors && indResults.candidateRowsGenerated > 0;
    if (indResults.candidateRowsGenerated === 0) indResults.periodRange = { min: "", max: "" };
    return { hasErrors, results: indResults };
  };

  const pmiRes = parsePMI();
  results.perIndicatorSummary["PMI_MANUFACTURING"] = pmiRes.results;
  if (pmiRes.results.readyForConfirmWrite) results.indicatorsReadyForConfirmWrite.push("PMI_MANUFACTURING");
  else results.blockedIndicators.push("PMI_MANUFACTURING");
  
  const policyRes = parsePolicyRate();
  results.perIndicatorSummary["POLICY_RATE"] = policyRes.results;
  if (policyRes.results.readyForConfirmWrite) results.indicatorsReadyForConfirmWrite.push("POLICY_RATE");
  else results.blockedIndicators.push("POLICY_RATE");

  const marketRes = parseMarketTrading();
  results.perIndicatorSummary["MARKET_TRADING_VALUE"] = marketRes.results;
  if (marketRes.results.readyForConfirmWrite) results.indicatorsReadyForConfirmWrite.push("MARKET_TRADING_VALUE");
  else results.blockedIndicators.push("MARKET_TRADING_VALUE");

  results.totalCandidateRowsGenerated = pmiRes.results.candidateRowsGenerated + policyRes.results.candidateRowsGenerated + marketRes.results.candidateRowsGenerated;
  results.needsReviewCount = results.totalCandidateRowsGenerated;

  console.log("\n--- DRY RUN RESULTS ---");
  console.log(JSON.stringify(results, null, 2));

  if (pmiRes.hasErrors || policyRes.hasErrors || marketRes.hasErrors) {
    console.error("\nValidation failed for some rows. Please review errors.");
    process.exit(1);
  } else {
    console.log("\nValidation passed. Ready for confirm write.");
  }
}

runDryRun();
