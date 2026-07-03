# Phase 154E — Confirm-Write MarketPrice Time-Series For HPG/VNM/MWG

## Goal
Confirm-write the historical MarketPrice time-series data for HPG, VNM, and MWG from the local CSV (`market_prices_hpg_vnm_mwg_from_2020.csv`) into the `MarketPrice` table to power real Technical/PVT charting functionality. Ensure idempotency and safety without any prohibited fields or advice.

## Scope
- Database writes limited specifically to creating the `DataSource` dependency and inserting `MarketPrice` rows.
- Complete idempotency required.
- No schema changes.
- No external provider fetches.
- No modifications to Company, Industry, or Screening Candidate components.
- Raw CSV strictly omitted from the repository workspace.

## Execution Notes
- **Source CSV Path:** `D:\market_prices_hpg_vnm_mwg_from_2020.csv`
- The file was read directly from the external filesystem line-by-line and was never copied or tracked by Git.
- **DataSource Requirement:** The required `DataSource` named "VNStock historical market price" was generated safely using the pre-existing schema enums (`licensed_vendor`, `manual_upload`, etc).

## Idempotency and Integrity
| Metric | Value |
| :--- | :--- |
| **Total Rows Processed** | 5,097 |
| **Rows Written by Ticker** | HPG: 1,699, VNM: 1,699, MWG: 1,699 |
| **Date Range by Ticker** | HPG/VNM/MWG: `2019-09-13` to `2026-07-03` |
| **Unit Validation** | Strict checks active (VND, shares, vnd_per_share). 0 failures. |
| **Duplicate Ticker-Date Rows** | 0 before write. 0 after write. |
| **Idempotency Result** | Second run skipped exactly 5,097 rows cleanly. No duplicates created. |
| **Final MarketPrice Rows** | 5,097 strictly for this historical source. |

## Feature Status
| Guardrail | Adherence Status |
| :--- | :--- |
| **Provider Fetches** | 0 external network requests |
| **Schema Changes** | None forced or required |
| **Open/High/Low Fields** | Validated safely but included as per existing DB schema definitions. |
| **Forbidden Wording** | No Target Price, Trading Signal, Upside, Downside, or Buy/Hold/Sell advice included. |
| **Benchmarks & Scoring** | None generated or calculated |
| **Production Approved True Count** | 0 |
| **HSG & NKG Touched** | No (Count = 0) |
| **TVN Present** | No (Count = 0) |

## Recommended Next Phase
**Phase 154F — Technical/PVT Time-Series Read-Path Smoke For HPG/VNM/MWG**
