# Macro Parser Strategy

## Purpose
This document outlines the strategy for building parsers to fetch data for the frontend-locked macro indicators. Not all sources have clean APIs. This strategy dictates which sources can be automated via HTML scraping, which have clean APIs, and which must remain manual.

## Parser Feasibility Classification (Phase 148D)
All manual-review indicators from Phase 148C have been classified:

### 1. High Priority Candidates (Phase 148G Targets)
These indicators have feasible data paths and are domestic/critical. In Phase 148G, a real-source parser dry run was attempted using verified URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`:
- `USD_VND` (SBV HTML): `html_parser_feasible` -> **Blocked** (PARSER_EXTRACTION_FAILED, USD_ROW_NOT_FOUND)
- `INTERBANK_RATE_OVERNIGHT` (SBV HTML): `html_parser_feasible` -> **Blocked** (PARSER_EXTRACTION_FAILED, OVERNIGHT_ROW_NOT_FOUND)
- `MARKET_TRADING_VALUE` (Market API): `api_ready`
- `FOREIGN_NET_FLOW` (Market API): `api_ready`

Due to the complex and unstable structure of the SBV HTML tables, the naive regex parser successfully failed-closed. No hardcoded or fake data was extracted. Both indicators remain gracefully blocked from downstream DB updates until the parser is hardened.

### 2. Medium Priority Candidates
These indicators have feasible paths but are either lower priority (global) or more difficult to parse (Excel downloads):
- `EXPORT_GROWTH` (GSO Excel): `csv_excel_ready`
- `PUBLIC_INVESTMENT` (GSO Excel): `csv_excel_ready`
- `BRENT_OIL_PRICE` (FRED/Global API): `api_ready`
- `DXY` (Global API): `api_ready`
- `FED_FUNDS_RATE` (FRED): `api_ready`

### 3. Low Priority / Manual Review Only
These indicators have highly unstructured data (e.g. text in PDFs) making automated parsing too risky:
- `CREDIT_GROWTH` (SBV Press Releases): `manual_review_only`

### 4. Blocked
- `PMI_MANUFACTURING`: Proprietary/paywall blocked.
- `GLOBAL_FLOW`: Source unidentified.

## Guardrails
- **Parser Feasibility is NOT Data**: Just because an indicator is `api_ready` does not mean the system possesses the observation data. The UI and Assistant must explicitly treat it as "Chưa có dữ liệu" until the parser successfully executes and writes to the DB.
- **No Mock Scraping**: We do not hardcode values to pretend a parser works. All parsing attempts must fetch the live source.
