# Macro Parser Strategy

## Purpose
This document outlines the strategy for building parsers to fetch data for the frontend-locked macro indicators. Not all sources have clean APIs. This strategy dictates which sources can be automated via HTML scraping, which have clean APIs, and which must remain manual.

## Parser Feasibility Classification (Phase 148D)
All manual-review indicators from Phase 148C have been classified:

### 1. High Priority Candidates (Phase 148E Targets)
These indicators have feasible data paths and are domestic/critical:
- `USD_VND` (SBV HTML): `html_parser_feasible`
- `INTERBANK_RATE_OVERNIGHT` (SBV HTML): `html_parser_feasible`
- `MARKET_TRADING_VALUE` (Market API): `api_ready`
- `FOREIGN_NET_FLOW` (Market API): `api_ready`

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
