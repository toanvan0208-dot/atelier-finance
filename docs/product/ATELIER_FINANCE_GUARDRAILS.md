# Atelier Finance Guardrails

## 1. Product purpose

Atelier Finance helps beginners, students, and individual investors understand financial/stock data, identify risks, and form analysis arguments. It must not provide buy/sell/hold recommendations or trading signals.

## 2. Forbidden recommendation behavior

The product must not:

- recommend buy, sell, or hold decisions;
- provide trading signals or entry/exit points;
- claim a stock is safe, certainly cheap, certainly bad, or worth buying;
- provide target prices, fair values, upside/downside calls, or action conclusions;
- turn valuation, checklist, risk, Technical/PVT, or Financials output into advice.

Users may receive neutral educational context, data-quality notes, source limitations, and analysis prompts that help them form their own arguments.

## 3. Forbidden browser-visible wording

Do not add positive browser-visible claims using these phrases or their close equivalents:

```text
nên mua
nên bán
nên nắm giữ
tín hiệu mua
tín hiệu bán
điểm mua
cổ phiếu an toàn
chắc chắn rẻ
chắc chắn xấu
định giá hấp dẫn
đang rẻ
đáng mua
rẻ
đắt
hấp dẫn
giá mục tiêu
mục tiêu giá
upside
downside
production-ready
dữ liệu chính thức
dữ liệu thời gian thực
```

Safe negative context is allowed in docs/tests when it exists to prevent these claims.

## 4. Data quality rules

- Missing data must be represented as `null`, `not_available`, `unavailable`, `insufficient_data`, or `not_applicable`.
- Do not use `0` to replace missing data.
- Do not divide by `0`.
- Do not guess unit by magnitude.
- Unknown unit must block unit-sensitive calculations.
- Invalid unit metadata must fail closed.
- Partial data must stay partial and must not silently fall back to sample values.
- Source, period, as-of, missing-field, warning, and readiness metadata must be preserved where available.

## 5. Unit metadata rules

- Units must be explicit for unit-sensitive Financials and Market/PVT handoffs.
- Missing unit metadata should be treated as `unknown_unit`.
- Numeric scale must not be inferred from value size.
- Financials-owned units and Market/PVT-owned units must remain separate.
- Financials unit metadata does not approve the source.
- Market/PVT unit metadata does not approve the source.

## 6. Source/evidence rules

- Source evidence and legal/source-owner review are required before any production-approved claim.
- Manual/user-provided/local research/synthetic data is not production-approved.
- Local DB-backed data does not imply official, realtime, or production-approved data.
- Source URL, source owner, document reference, terms/license status, runtime display permission, caching/storage permission, and review notes must be tracked before approval.
- If evidence is missing, ambiguous, or unreviewed, the source must fail closed.

## 7. productionApproved rules

- `productionApproved:false` for local/research-only/sample/synthetic/manual data.
- `productionApproved:false` must remain visible in source/readiness metadata where the current UI contract exposes it.
- Do not set `productionApproved:true` unless a future phase explicitly completes and validates the source approval workflow.
- Market/PVT DB-backed does not mean production-approved.
- Financials DB-backed does not mean production-approved.
- Financials DB-backed does not mean Valuation fully DB-backed.

## 8. Financials guardrails

- Financial statements must preserve missing values as missing/null.
- No zero-fill is allowed for absent financial statement fields.
- Explicit unit metadata is required before scale-sensitive downstream handoff.
- EPS `<= 0` means P/E is not applicable and must not be interpreted as cheap/normal.
- Equity `<= 0` means P/B/BVPS/ROE must not be interpreted normally.
- SharesOutstanding `<= 0` means marketCap/BVPS/share-based metrics must not be calculated.
- Financials CSV parser boundaries must remain string/fixture-only unless a future phase explicitly allows filesystem import.
- No production CSV importer exists until a future phase explicitly adds and validates one.

## 9. Market/PVT guardrails

- `marketPrice <= 0` means market-based metrics must not be calculated.
- `marketCap <= 0` means P/S from marketCap must not be calculated.
- Market/PVT source ownership is separate from Financials source ownership.
- Market/PVT DB-backed does not mean production-approved.
- PVT indicators must not become trading signals.
- Support/resistance, volume, chart, or trend context must stay educational and source-bounded.

## 10. Valuation guardrails

Do not add target price, fake fair value, upside/downside, recommendation, DCF/EV/EVEBITDA claims unless a future explicitly scoped phase safely implements and validates them. Default is forbidden.

Additional rules:

- Valuation may show bounded readiness/status for already-approved helper metrics only.
- `canClaimValuationDbBacked:false` remains required where Financials or Market/PVT handoff is partial or mixed-source.
- Missing EPS, non-positive EPS, missing equity, non-positive equity, missing shares, missing market price, missing market cap, or unknown units must block affected metrics.
- EV, EV/EBITDA, DCF, fair value, and target price remain blocked by default.

## 11. Risk/checklist guardrails

- Risk output must not become risk scoring that implies investment safety.
- Checklist output must not become a recommendation.
- Risk/checklist modules may identify missing evidence, risk factors, and questions to investigate.
- Do not claim a stock is safe or unsafe as an action conclusion.

## 12. UI wording guardrails

- Use neutral labels such as readiness, unavailable, insufficient data, source status, evidence status, and limitations.
- Do not claim official source, realtime data, production-ready state, or production-approved data unless explicitly validated.
- Browser-visible warnings should explain boundaries without encouraging trades.
- Machine-readable flags such as `productionApproved:false` and `canClaimValuationDbBacked:false` are allowed when they document current limitations.

## 13. Safe negative context rule for docs/tests

Docs and tests may include forbidden phrases only as negative examples, assertions, blocked wording lists, or guardrail checks. They must not present those phrases as product claims, UI promises, investment advice, or positive output examples.
