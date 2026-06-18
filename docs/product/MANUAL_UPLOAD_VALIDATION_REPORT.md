# Manual Upload Validation Report

Date: 2026-06-18

Phase: 28B - Manual Upload Validation Report

This document describes the validation report layer for manual upload data. It does not add an upload UI, backend endpoint, database, real API call, or production data integration.

## Purpose

The report converts `ManualUploadAdapterResult` into:

- a machine-readable report for future UI/preview flows;
- a human-readable report for thesis/local verification;
- optional markdown text that can be displayed or copied into a project report.

The report checks data quality and readiness only. It is not an investment recommendation.

## Inputs

The builder receives the result of `normalizeManualUpload(...)`, including:

- `rowResults`;
- `summary`;
- `warnings`;
- `errors`;
- canonical financial statement, market, and valuation records where available.

## Machine-Readable Sections

- `status`: `pass`, `needs_review`, or `failed`.
- `readiness`: inherited from adapter readiness.
- `summary`: totals, valid/error ratios, and row counts.
- `severityCounts`: `info`, `warning`, `error`, `critical`.
- `categoryCounts`: missing fields, invalid numbers/dates, stale data, non-VND currency, unmapped fields, guardrails, source policy, and parser limitations.
- `topIssues`: grouped issues with suggested actions.
- `fieldCoverage`: present/missing/invalid counts for core canonical fields.
- `moduleReadiness`: Financials, Valuation, Risk, PVT, and Overview.
- `rowDiagnostics`: per-row errors, warnings, missing fields, unmapped fields, and readiness.
- `safeNextSteps`: data-quality follow-up actions.

## Human-Readable Format

The markdown report contains:

- Summary;
- Main Issues;
- Field Coverage;
- Module Readiness;
- Recommended Data Fixes;
- Scope Note.

The wording must remain neutral: the report can say data is sufficient, insufficient, needs review, missing, or not applicable. It must not use buy/sell/hold wording or present valuation conclusions as action guidance.

## Readiness Scope

Financials checks core statement fields and warns when operating cash flow is missing.

Valuation checks close price, EPS/BVPS availability, shares context, and guardrails such as EPS <= 0 and equity <= 0.

PVT checks ticker, close price, volume or trading value, and asOf.

Risk is conservative and usually needs review unless debt, cash-flow, working-capital, and company-type context are present.

Overview summarizes whether enough source-ready records exist for a useful preview.

