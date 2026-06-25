# PHASE139M: VCB Bank-Specific Annual Report Preview

## 1. Phase summary
- **Goal**: Perform source-quality and data preview dry-run for VCB (Vietcombank) Annual Report 2025.
- **Scope**: Research-only preview. No DB write, no schema changes, no import.
- **Constraints**: Apply strict bank-specific logic. Do not map corporate totalDebt logic to banking liabilities.

## 2. Source file checked
- **Location**: `docs/product/evidence/source-pdfs/VCB_Annual_Report_2025.pdf`
- **Status**: Found and checked for basic metadata matching.

## 3. Entity / scope / audit verification
- **Entity**: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank / VCB) - Validated.
- **Report Type**: Báo cáo thường niên 2025 / Báo cáo tài chính hợp nhất - Validated.
- **Audit Status**: Audited (KPMG) - Validated.
- **Result**: `valid_vcb_consolidated`.

## 4. Preview values
- **EPS**: `null` (needs_review, manual verification required, `vnd_per_share`)
- **Shares Outstanding**: `null` (needs_review, manual verification required, `shares`)
- **Total Debt**: `null` (missing, bank-specific structure means standard mapping is `not_applicable`)
- **Data Mode**: `research_only`
- **Production Approved**: `false`

## 5. Banking caveat
- **VCB is a bank** so we do not use corporate `totalDebt` mapping.
- **Do not use total liabilities**.
- **Do not use customer deposits**.
- **Do not use tổng nợ phải trả làm totalDebt**.
- `totalDebt` is explicitly left as `null` and marked `needs_bank_mapping` until a proper bank financial model is implemented.

## 6. Explicit non-import confirmations
- No DB seed modifications.
- No Prisma writes/creates/upserts.
- No `confirm-write` flag or logic.
- Dry-run script safely exits with `0` DB writes.

## 7. Guardrail confirmations
- No buy/sell/hold recommendations.
- No trading signals.
- No target price or fair value statements.
- Missing data is kept as `null` or `needs_review`, NOT `0`.
- Did not sample or fallback to real values.
- `productionApproved` forced to `false` for all previewed fields.

## 8. Validation results
- `npx prisma validate`: Passed
- `npm run typecheck`: Passed
- `npm run lint`: Passed
- `npm test`: Passed
- `npm run build`: Passed

## 9. Git status
- Only 4 Phase 139M specific files staged/committed.
- No unrelated tracks or docs changes.
- `VCB_Annual_Report_2025.pdf` remains explicitly UNTRACKED and NOT committed.
