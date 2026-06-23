# Phase 138F — VNStock financials connector preview-only

## Phase objective

Build a read-only VNStock probe and pure normalizer for FY2025 candidate `eps`, `totalDebt`, and `sharesOutstanding` values for FPT, MWG, VNM, HPG, VCB, and MSN. The output must preserve field provenance, units, missing/ambiguous status, `research_only` classification, and `productionApproved: false`.

## Scope boundaries

- Preview/probe and normalization only.
- No DB write, import, confirm-write, schema change, or migration.
- No PDF extraction or PDF verification.
- No reviewed, official, or production-approved claim.
- No inference of EPS from profit and shares.
- No inference of shares outstanding from charter/share capital or listed volume.
- No substitution of liabilities or total liabilities for total debt.

## Implementation

- `src/lib/data-sources/vnstock-financials-candidate.ts` is a pure normalizer. It always emits the three target fields and keeps missing, non-finite, or ambiguous values null.
- `src/lib/data-sources/vnstock-financials-probe.ts` contains an opt-in local Python subprocess probe. It has no Prisma/database dependency and reports `databaseWriteAttempted: false`.
- `scripts/probe-vnstock-financials.ts` is the preview-only CLI. Network access requires the explicit `--allow-network` flag.
- `src/lib/data-sources/__tests__/vnstock-financials-candidate.test.ts` covers explicit mapping, missing/invalid values, debt/liability guardrails, VCB handling, metadata, and network opt-in.

## Commands run

Discovery and focused verification:

```text
python --version
python -m pip show vnstock
python - (defensive class/method signature introspection)
python - (FPT VCI/KBS method-shape probes)
npx vitest run src/lib/data-sources/__tests__/vnstock-financials-candidate.test.ts
npx tsc --noEmit --pretty false
```

Live preview:

```text
npx tsx scripts/probe-vnstock-financials.ts --tickers FPT,MWG,VNM,HPG,VCB,MSN --fiscal-year 2025 --allow-network
```

Required validation:

```text
npx prisma validate
npm run typecheck
npm run lint
npm test
npm run build
```

## Live probe execution

- Executed: **yes**
- Date: 2026-06-23 (Asia/Saigon)
- Installed package: `vnstock 4.0.4`
- Requested period: FY2025
- All six tickers returned the probed VCI statement shapes and KBS overview shape without per-ticker probe errors.

## VNStock API/method shape discovered

Defensive introspection found the public `Finance` constructor shape:

```text
Finance(source, symbol, period="quarter", get_all=True, show_log=False)
```

The available callable methods include `income_statement`, `balance_sheet`, `cash_flow`, and `ratio`. This phase called only the methods needed for the three target fields and checked callability at runtime:

- `Finance(source="VCI", period="year").income_statement()`
- `Finance(source="VCI", period="year").balance_sheet()`
- `Company(source="KBS").overview()` for its explicitly named `outstanding_shares` plus `as_of_date`

For FPT, MWG, VNM, HPG, and MSN, both VCI statement frames were shaped `25 x 7` and `122 x 7`; VCB used bank-specific shapes `26 x 7` and `86 x 7`. Statement columns were `item`, `item_en`, `item_id`, `2025`, `2024`, `2023`, and `2022`. KBS overview returned one row with an explicit `outstanding_shares` field and `as_of_date`.

`Finance.ratio()` was inspected but excluded from normalization because the observed VCI response repeated ambiguous period labels. No ratio value was used.

## Per-ticker normalized preview

All listed values remain VNStock research candidates, not reviewed or official data.

| Ticker | EPS | totalDebt | sharesOutstanding |
|---|---:|---|---:|
| FPT | `5216` VND/share — candidate | null — needs_review | `1,703,507,121` shares — candidate |
| MWG | `4774` VND/share — candidate | null — needs_review | `1,468,423,529` shares — candidate |
| VNM | `4028` VND/share — candidate | null — needs_review | `2,089,955,445` shares — candidate |
| HPG | `1973` VND/share — candidate | null — needs_review | `7,675,465,855` shares — candidate |
| VCB | `3854` VND/share — candidate | null — ambiguous | `8,355,675,094` shares — candidate |
| MSN | `2710` VND/share — candidate | null — needs_review | `1,520,491,927` shares — candidate |

### Field provenance and unit notes

- EPS uses only `VCI.income_statement.eps_basic_vnd` for FY2025. The raw key explicitly states VND, so the normalized unit is `vnd_per_share`.
- Shares outstanding uses only `KBS.overview.outstanding_shares`, whose `as_of_date` was `2025-12-31` for all six previewed rows. The normalized unit is `shares`.
- For the five non-bank tickers, VCI exposed `short_term_borrowings` and `long_term_borrowings`, but did not expose a direct `total_debt`/`total_borrowings` row. The preview does not sum these components, does not guess their unit, and leaves `totalDebt` null/`needs_review`.
- For VCB, the VCI banking balance sheet exposed `total_liabilities`, not a defensible total-debt equivalent. It remains null/`ambiguous` and is explicitly rejected as a `totalDebt` mapping.
- Null, undefined, empty, NaN, and infinite inputs remain null and never become zero.

## VCB banking caveat

VCB uses a bank-specific financial statement layout. Deposits, total liabilities, derivatives, and other banking liability lines are not industrial-company borrowings and must not be forced into `totalDebt`. Phase 138F therefore allows direct EPS and explicit outstanding-shares candidates, while leaving VCB `totalDebt` null/`ambiguous` pending a bank-specific reviewed mapping.

## Data classification and write boundary

Every normalized row is:

- `sourceLabel: vnstock_financials_candidate`
- `dataMode: research_only`
- `productionApproved: false`
- `status: candidate | missing | needs_review | ambiguous`

No DB write, import, confirm-write, schema change, or migration happened. The probe does not import Prisma or any persistence service. Nothing in this phase is reviewed, official, or production approved.

## Validation results

- `npx prisma validate`: passed; schema valid.
- `npm run typecheck`: passed.
- `npm run lint`: blocked by the pre-existing untracked `scripts/svg_to_png_puppeteer.js` (`@typescript-eslint/no-require-imports` on lines 1-3, plus one unused-variable warning). Scoped ESLint for every Phase 138F TypeScript file passed.
- `npm test`: passed; final full rerun reported 1085/1085 tests passed and 0 failed.
- `npm run build`: passed after keeping the CLI-only subprocess probe out of the application barrel; final build had no trace warning.
- Focused normalizer tests after the final change: passed, 14/14.

Because the required full lint command did not pass due to that unrelated pre-existing file, Phase 138F was not committed or pushed at the time this evidence was updated. The unrelated file was preserved rather than edited, deleted, ignored, or staged without authorization.

## Next recommended phase

VNStock supplied useful FY2025 candidates for EPS and explicit outstanding shares, while safe `totalDebt` was unavailable. The next phase should design a controlled preview-to-import workflow with a review gate and `productionApproved: false`, using the local 2025 PDFs to verify or override candidate values before any reviewed import. The workflow must retain the VCB-specific banking mapping boundary and must not promote VNStock candidates directly to reviewed/official data.
