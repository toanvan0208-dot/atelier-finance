# Phase 154D — MarketPrice Time-Series CSV Dry Run For HPG/VNM/MWG

## Goal
Perform a dry-run to validate the historical market price time-series CSV for HPG, VNM, and MWG (`market_prices_hpg_vnm_mwg_from_2020.csv`) against the existing `MarketPrice` schema. This aims to prepare data essential for full Technical/PVT chart rendering, without performing any DB writes.

## Scope
- Dry-run validation only. 
- No actual database writes, schema changes, or external provider fetches.
- Validated required fields, units, and structural integrity of the CSV lines.
- Identified blocker (missing DataSource dependency).

## Execution Notes
- **CSV Source:** Parsed the locally provided CSV file `D:\market_prices_hpg_vnm_mwg_from_2020.csv` directly from the filesystem.
- **CSV was read outside repo and not committed:** The raw CSV file was not moved into the repository and has not been tracked by Git, keeping the worktree clean.

## Dry Run Results
| Metric | Value |
| :--- | :--- |
| **Total Rows** | 5,097 |
| **Rows by Ticker** | HPG: 1,699, VNM: 1,699, MWG: 1,699 |
| **Date Range by Ticker** | HPG/VNM/MWG: `2019-09-13` to `2026-07-03` |
| **Duplicate Ticker-Date Rows** | 0 |
| **Unsupported Tickers** | 0 |
| **TVN Rows** | 0 |
| **HSG/NKG Write Candidates** | 0 |
| **Unit Validation Passed** | Yes (strict checks for HOSE, VND, shares, vnd_per_share) |
| **Mapping into MarketPrice** | Mapped correctly. Open/High/Low validated but stored as requested. |
| **Existing DB Match Summary** | 0 exact matches for the historical source label |
| **Rows Would Insert** | 5,097 |
| **Rows Would Update** | 0 |
| **Rows Would Skip** | 0 |
| **DataSource Readiness** | Missing! (`VNStock historical market price` source dependency not found) |
| **Zero-Fill Detected** | False |
| **Production Approved Count** | 0 |

## Confirmations
- **DB Writes:** None
- **Provider Fetch:** None
- **Schema Change:** None
- **Forbidden Trading/Advice Wording:** None introduced.
- **Benchmark/Ranking/Scoring:** None introduced.

## Recommended Next Phase
**Phase 154E — Confirm-Write MarketPrice Time-Series For HPG/VNM/MWG** 
(Will include creation of the required `DataSource` and execution of the validated inserts).
