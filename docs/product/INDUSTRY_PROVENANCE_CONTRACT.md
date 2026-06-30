# Industry Provenance Contract

## Purpose

Industry context in Atelier Finance is qualitative educational context. It helps users understand how an industry earns money, what drivers matter, and which checks should happen next. It is not a trading signal, valuation conclusion, or recommendation.

This contract defines the minimum provenance needed before qualitative industry context can be treated as reviewed candidate data.

## Current Storage

Current Prisma model: `IndustryContext`.

Available fields:

- `industryCode`
- `industryName`
- `contextLanguage`
- `industryOverview`
- `keyDrivers`
- `industryRisks`
- `relatedTickers`
- `asOfDate`
- `sourceLabel`
- `dataMode`
- `productionApproved`
- `needsReview`
- `createdAt`
- `updatedAt`

Known limitations:

- no native `sourceUrl`
- no native `publicationDate`
- no native `extractedQuote`
- no row-level `warningCodes`
- no native `reviewNote`
- no dedicated `IndustryContextProvenance` sidecar
- no numeric `IndustryMetric` model

`sourceLabel` alone is not enough to represent reviewed source provenance.

## Minimum Reviewed Qualitative Context Contract

Future reviewed industry context candidates should carry:

| Field | Required | Notes |
| --- | --- | --- |
| `ticker` or `relatedTickers` | yes | Must link to supported ticker(s). |
| `industryCode` | preferred | Optional only when a reviewed source does not provide a stable code. |
| `industryName` | yes | User-facing industry label. |
| `contextLanguage` | yes | Current UI expects Vietnamese context. |
| `industryOverview` | yes | Qualitative summary from reviewed evidence. |
| `keyDrivers` | yes | Qualitative drivers from reviewed evidence. |
| `industryRisks` | yes | Qualitative risks from reviewed evidence. |
| `asOfDate` | yes | Date the context/evidence is considered valid as of. |
| `sourceLabel` | yes | Stable label for the source/evidence bundle. |
| `sourceUrl` | yes for reviewed import | Current schema cannot store it directly. |
| `publicationDate` | preferred | Required for articles/reports where available. |
| `extractedQuote` | yes for manual/reviewed context | Short evidence excerpt or reviewed note. |
| `dataMode` | yes | Use `research_only` until a separate approval process exists. |
| `productionApproved` | yes | Must remain `false` for candidate/research/manual rows. |
| `needsReview` | yes | Must remain `true` until stronger review gate exists. |
| `warningCodes` | yes | Must record caveats such as missing source URL or legacy source. |
| `reviewNote` | preferred | Human-readable provenance limitation and review notes. |

## Runtime Rules

- Missing industry context remains missing.
- Static guidance must not be promoted to sourced DB data.
- Legacy mock-labeled text must be suppressed from runtime payloads.
- Missing source URLs must not be invented.
- Numeric metrics and valuation/risk benchmarks must not be invented.
- `productionApproved=true` is out of scope for candidate/manual/research rows.

## Future Schema Direction

Preferred next step: add a dedicated `IndustryContextProvenance` sidecar later.

Recommended fields:

- `id`
- `industryContextId`
- `ticker`
- `industryName`
- `sourceLabel`
- `sourceUrl`
- `sourceType`
- `dataMode`
- `productionApproved`
- `needsReview`
- `publicationDate`
- `retrievedAt`
- `extractedQuote`
- `reviewNote`
- `warningCodes`
- `createdAt`
- `updatedAt`

Why sidecar is preferred:

- preserves current `IndustryContext` shape;
- supports multiple evidence rows per context;
- avoids overloading qualitative content fields with provenance;
- mirrors the separation already used for macro observations/provenance.

## Numeric Industry Metrics

Numeric industry metrics should be delayed until a stable source and unit contract exist.

If later needed, prefer a dedicated `IndustryMetric` model or a clearly compatible observation/provenance pattern. Do not mix qualitative context, numeric industry metrics, and valuation/risk benchmarks in the current `IndustryContext` table.
