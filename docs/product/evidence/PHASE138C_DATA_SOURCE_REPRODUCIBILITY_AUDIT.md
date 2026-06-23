# Phase 138C: Data Source Evidence and Reproducibility Audit

## Import Scope
In Phase 138B, controlled research data was imported for three tickers: `HPG`, `VCB`, and `MSN`.
The fields imported were:
- **Financials**: `totalDebt`, `eps`, `sharesOutstanding`
- **Market Prices**: `closePrice`, `volume`

## Source Traceability Status
- **Financials**: `untraceable` / `placeholder_suspected`
  The source label used was `manual_reviewed_financial_statement_2024` with sourceName `official_annual_report`. However, the input CSV file containing the data was deleted from the repository. The numeric values inserted (e.g., EPS 3000, 5000, 2000; totalDebt 60000, 50000, 40000) are heavily rounded and have no concrete tracing to an actual page or link in the annual reports. They are determined to be arbitrary placeholders used for a quick local test.
- **Market Prices**: `traceable_but_research_only`
  The source used was `vnstock_research_candidate`. The market prices were fetched using the local VNStock Python subprocess over a bounded date range.

## Reproducibility Status
- **Financials**: `Lost`. Because the CSV input file (`phase138b_reviewed_source_records_candidate.csv`) was deleted and not committed, and the writes were only made to the local gitignored SQLite `dev.db`, the financial rows cannot be recreated from the repo.
- **Market Prices**: `Reproducible`. The network import commands for `vnstock` can be re-run since the script takes ticker and date range arguments directly from the CLI.
- **Overall DB Risk**: `High`. The local dev database is not version controlled. By not committing the source seed files, the system cannot reliably recreate the financial history of HPG/VCB/MSN across different environments.

## Allowlist Status
- **Previous Tickers**: FPT, MWG, VNM
- **Current Tickers**: FPT, MWG, VNM, HPG, VCB, MSN
- **Audit Result**: `Safe`. The allowlist was narrowly expanded to exactly include the 3 candidates. No unrestricted wildcard imports were allowed.

## VNStock Subprocess Scope Status
- **Controlled Allowlist**: Yes
- **Date Bounded**: Yes
- **No Bulk Crawl**: Yes
- **Dry-run/Confirm-write Preserved**: Yes
- **Production Approved**: False (Strictly Research Only)
- **Risk Level**: `Low`

## Required Next Action
The placeholder data for HPG, VCB, and MSN's financials must be purged and replaced with authentic, traceable data. An evidence trail (e.g., PDF snapshots, direct hyperlinks with page numbers) must be committed alongside the input CSV file so that the SQLite database can be rebuilt deterministically. We should not label data as `official_annual_report` if it cannot be proven.

## Phase 138D purge follow-up

- target rows previewed: 3 FinancialStatement rows (containing 9 UnitMetadata fields) and 9 ManualImportRecord rows.
- rows purged: 3 FinancialStatement rows (cascading to 9 UnitMetadata fields) and 9 ManualImportRecord rows.
- target rows remaining: 0.
- protected rows verified: `MarketPrice` rows for HPG/VCB/MSN remain untouched (66 rows). FPT/MWG/VNM data remains fully intact.
- runtime after purge: Safe. The UI displays proper "needs_review", "insufficient_data", or "N/A" messages instead of placeholder data without any mojibake or hydration issues.
- remaining limitation: The local database has mutated and we still need to import authentic traceable financials to restore functionality for HPG/VCB/MSN.
