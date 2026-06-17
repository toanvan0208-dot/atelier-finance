# Source Evidence Policy

Date: 2026-06-17

Phase: 27B - Source Evidence & Adapter Policy Hardening

This policy defines the legal and technical gate that must sit before any real data adapter in Atelier Finance. It does not approve any real data source, connect to an API, import data, add a database, or make the product real-data enabled.

This policy reduces legal and technical risk, but it is not a legal opinion. Final production use still requires manual review of each source's license, Terms of Service, and applicable law.

## Why This Exists

Atelier Finance can only treat a source as production-ready when the project has explicit evidence for license, Terms of Service, caching, redistribution, and derived-data rights. Source names found during external repo audit are research inputs only. They are not production approval.

Missing evidence must block runtime use instead of silently falling back to mock data or claiming that a source is verified.

## Source Status

| Status | Meaning |
| --- | --- |
| `approved` | May be considered for production only if source evidence is verified and rights are explicit. |
| `needs_legal_review` | Potential source, but license, ToS, access method, caching, redistribution, or attribution still needs review. |
| `research_only` | May be used for local research, thesis verification, or development fixtures with warnings. Not public-product runtime. |
| `blocked` | Must not run in adapters except tests that verify blocked behavior. |
| `unknown` | Unregistered or incomplete source. Not production-usable. |

## Usage Modes

| Mode | Allowed source use |
| --- | --- |
| `test` | Mock/test fixtures only, plus blocked-source tests. |
| `development` | Mock or research sources may be used with warnings. Blocked sources are still blocked. |
| `thesis_verification` | Academic/manual sources may be used only when evidence allows academic use. |
| `production` | Only approved sources with verified evidence and explicit runtime rights. |

## Production Approval Requirements

A source is not production-usable unless all of these are true:

- `evidenceStatus` is `verified`.
- License name and license URL are present.
- Terms URL is present.
- Commercial/public product use is explicitly allowed.
- Runtime display inside the product is explicitly allowed.
- Caching is explicitly allowed.
- Derived-data use is explicitly allowed.
- Required attribution text is present when attribution is required.
- Access method is not private, undocumented, or unreviewed scraping.
- Source status is `approved`.

Code must not automatically promote `unknown`, `research_only`, or `needs_legal_review` to `approved`.

## Caching And Redistribution

Runtime display is separate from redistribution. A source may allow data to be displayed inside the app without allowing raw dataset redistribution.

If `allowsRuntimeDisplay` is `false` or `unknown`, adapters must not use the source in public product runtime. If `allowsCaching` is `false` or `unknown`, adapters must not cache source data. If `allowsRedistribution` is `false` or `unknown`, adapters must not redistribute raw source data or expose downloadable/source-equivalent datasets.

## Raw And Derived Data

Raw data includes source-provided fields such as close price, volume, revenue, net income, assets, equity, EPS, BVPS, macro values, and industry metrics.

Derived or normalized data includes adapter-normalized records, P/E, P/B, ROE, risk flags, readiness status, stale flags, and other calculations. Derived metrics must preserve source lineage through metadata such as `derivedFrom`, source, `asOf`, period, missing fields, and warnings. Derived outputs still need to respect the source license and Terms of Service; normalization does not remove source obligations.

## Private, Undocumented, Or Scraped Access

Private or undocumented APIs are blocked by default. Scraped sources require legal review and must not be production-approved without explicit evidence that access and use are allowed.

## Academic Or Thesis-Only Data

Academic-only or manual verification sources may support local thesis checks, but they are not public-product runtime sources. They must carry warnings and must not be mixed into production output.

## Adapter Rule

When a source is not allowed for the current mode, adapter code must return a safe result:

- `data: null`
- `metadata: null`
- `readiness: not_ready`
- explicit `errors`
- policy warnings when relevant

Adapters must not fallback to mock data when a real source is blocked.

## Checklist Before Writing A Real Adapter

- Source has a `SourceEvidence` record.
- License and Terms of Service are linked and reviewed.
- Runtime display rights are explicit.
- Caching rights are explicit.
- Redistribution rights are explicit if raw/source-equivalent data will be redistributed.
- Derived-data rights are explicit.
- Runtime mode is defined.
- Private or undocumented access is blocked or explicitly reviewed.
- Missing/invalid data remains `null`, `not_available`, `insufficient_data`, or `not_applicable`.
- Tests cover blocked, research-only, academic-only, and approved cases.

## External Audit Sources

Sources mentioned in external repo audits, including market websites, broker endpoints, financial portals, and downloaded sample files, remain research inputs. They are not production-approved unless this policy is satisfied with explicit evidence.
