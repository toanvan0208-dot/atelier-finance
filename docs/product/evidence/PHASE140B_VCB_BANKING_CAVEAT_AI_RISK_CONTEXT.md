# PHASE140B: VCB Banking Caveat in AI and Risk Context

## 1. Phase summary
- **Goal**: Resolve the P1 gap identified in Phase 140A by injecting explicit banking caveats into the AI Assistant context and the Risk context specifically for VCB.
- **Scope**:
  - `src/components/layout/assistant-screen-context.ts`
  - `src/features/risk/lib/risk-financials-runtime-readiness.ts`
- **Result**: Successfully injected entity-type identification and banking caveats for VCB to prevent improper corporate debt/leverage interpretation.

## 2. Files changed
- `src/components/layout/assistant-screen-context.ts`: Added logic to push "bank" `entityType`, `bankingCaveat`, and `needs_bank_mapping` flag for VCB. Also injected banking caveats into `warnings` and `visibleFacts`.
- `src/components/layout/__tests__/assistant-screen-context.test.ts`: Added tests to verify the injection.
- `src/features/risk/lib/risk-financials-runtime-readiness.ts`: Added logic to push bank specific warning and adapt the `insufficient_data` message for missing debt.
- `src/features/risk/lib/__tests__/risk-financials-runtime-readiness.test.ts`: Added tests to verify the injection.

## 3. VCB banking caveat behavior
When ticker is "VCB", the system recognizes it as a bank, adding a caveat that normal corporate total debt mappings and interpretations do not apply.

## 4. AI context verification
For VCB, the Assistant context payload now includes:
```json
{
  "entityType": "bank",
  "bankingCaveat": true,
  "debtMappingStatus": "needs_bank_mapping"
}
```
And its `warnings` and `visibleFacts` contain text like: `"VCB is a bank; corporate debt/leverage interpretation is not applicable. Do not use total liabilities or customer deposits as totalDebt."`

## 5. Risk context verification
For VCB, missing `totalDebt` now returns the specific blocked reason: `"debt missing; bank_specific_debt_not_applicable; leverage risk is insufficient_data."`. It also injects the banking caveat warning directly into the Risk readiness payload. 

## 6. Non-bank regression verification
- Non-bank tickers (FPT, HPG, MSN, VNM, MWG) do not receive the `entityType: "bank"` flag or the banking caveat warnings.
- Missing debt for non-banks continues to report `"debt missing; leverage risk is insufficient_data."`

## 7. Guardrail confirmations
- AI prompt continues to strictly block buy/sell/hold/fair-value responses.
- Missing data remains null or `insufficient_data`; no zeroes are substituted.
- Total liabilities or deposits are explicitly prevented from replacing total debt.

## 8. Validation results
- `npx prisma validate`: Passed
- `npm run typecheck`: Passed
- `npm run lint`: Passed
- `npm test`: Passed
- `npm run build`: Passed

## 9. Git status
- Only test and implementation files for `assistant-screen-context` and `risk-financials-runtime-readiness` modified.
- No database schemas were changed.
- No new tracking or data writes introduced.
- TS build cache file successfully reverted before commit.
