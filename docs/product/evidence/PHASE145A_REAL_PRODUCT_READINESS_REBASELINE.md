# Phase 145A — Real Product Readiness Re-baseline

## Starting Commit
Phase 145A started from commit: 11e1852

## Scope
Audit the entire Atelier Finance system against the new "Real Product Readiness" standard. Identify all remaining mock/sample/fallback data, analyze production data provenance, and formulate a mock removal and hiding plan. This phase is purely audit and planning.

## New Product Standard
- Atelier Finance must transition to a real product with real data and real user flows.
- No disguised mocks.
- No demo-only presented as real.
- No fake sample/fallback data.
- Do not call `research_only` or manual candidate data "production data".
- No production deployment if core modules depend on mocks.

## Mock/Static/Sample/Fallback Inventory
A thorough scan of the repository revealed the following remaining mock/static artifacts:
1. **Unsafe Mocks Shown as Real:**
   - `src/features/simulation/data/simulation.data.ts`: Mock user portfolio and trading data.
   - `src/features/watchlist/`: Mock user watchlist data.
   - `src/features/business/components/BusinessUnderstandingDashboard.tsx`: Hardcoded "Mock data" chips for operational metrics.
2. **Safe Editorial Static Content:**
   - `src/features/learning/data/learning.data.ts`: Educational lessons and content.
   - `src/features/checklist/data/checkThinking.data.ts`: Question banks and logic rules.
3. **Temporary Evidence / Test Only:**
   - `src/features/financials/data/financialReadingDesk.data.ts`: Contains `financialsStatementMockSnapshot` (currently bypassed by DB read-path but still exists in codebase).
4. **Assistant / RAG:**
   - `src/app/api/assistant/route.ts`: Partial RAG logic relying on static prompt injections instead of a semantic vector database.

## Real Data Readiness Audit (Production Data/Provenance Gaps)
While recent phases successfully integrated DB read-paths for core modules, the underlying data inside the Postgres database is **not yet production-ready**.

| Data Domain | Current Source Label | Data Mode | Production Approved | Status |
|-------------|----------------------|-----------|---------------------|--------|
| **Company / Business** | `staging_company_business_profile_research_seed` | `research_only` | `false` | Not real. Research seed data. |
| **Financials** | `annual_report_2025_pdf_reviewed_preview` | `research_only` | `false` | Not real. Manual PDF extraction preview. |
| **Market / PVT** | `vnstock_research_candidate` | `research_only` | `false` | Not real. Candidate data from Python script. |
| **Macro / Industry** | `staging_seed` / `manual_research` | `research_only` | `false` | Not real. Manual research seed. |

**Conclusion:** All core data read-paths are functioning correctly against the database, but the data itself is `research_only`. To achieve real product readiness, we must integrate a true provider pipeline and set `productionApproved = true`.

## Module Readiness Matrix

| Module | Real Data? | Real Read-Path? | Real Write-Path? | Mock Remaining? | Production-ready? | Required Fix |
|--------|------------|-----------------|------------------|-----------------|-------------------|--------------|
| **Overview** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Macro** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Industry** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Business** | No (`research`) | Yes (DB) | N/A | Yes (UI metrics) | No | Remove UI mock metrics, need real data. |
| **Financials** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Valuation** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Risk** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Screening** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Checklist** | No (`research`) | Yes (DB) | N/A | No | No | Need production data pipeline. |
| **Learning** | Yes (Static) | Yes (Static) | N/A | No | Yes (as Editorial) | Label clearly as educational content. |
| **Watchlist** | No | No (Mock) | No | Yes | No | Hide until real Auth/Session + DB write-path. |
| **Simulation**| No | No (Mock) | No | Yes | No | Hide until real Auth/Session + DB write-path. |
| **Assistant** | No | Partial | N/A | Yes (Static RAG) | No | Need `pgvector` full RAG implementation. |
| **VCB (Bank)**| N/A | N/A | N/A | N/A | No | Unsupported. Needs explicit exclusion or real bank schema. |

## Mock Removal / Module Hiding Plan
To meet the strict requirement of "No demo-only presented as real":
1. **Hide Watchlist & Simulation:** Remove them from the primary product navigation until a real authentication and write-path design is implemented.
2. **Remove Business UI Mocks:** Strip out the hardcoded mock metric chips in the Business Understanding dashboard.
3. **Data Provenance Gate:** Ensure the UI strictly enforces `productionApproved = true` before allowing a module to be considered "production ready."

## Recommended Real-Product Roadmap
Based on the audit, here is the proposed sequential roadmap to transition Atelier Finance to a real product:

- **Phase 145B:** Hide/gate non-real modules (Watchlist, Simulation) and clean up residual UI mocks.
- **Phase 145C:** Production Data Provider & Provenance Hardening (Transition pipeline from `research_only` to `productionApproved=true`).
- **Phase 145D:** Real Authentication, User, and Session Design.
- **Phase 145E:** Real Watchlist and User State Write-Path.
- **Phase 145F:** Real Simulation / PaperTrade Write-Path.
- **Phase 145G:** Assistant Full RAG Design (Vector DB / `pgvector` integration).
- **Phase 145H:** Bank/VCB Support Design or explicit unsupported policy enforcement.

## Action Summary
- DB write: No
- Data seed/import: No
- Schema migration: No
- Rollback: No
- Production deploy/import: No
- Live LLM call: No

## Validation Result
Validation scripts (`build`, `lint`, `typecheck`, `test`) were run successfully.
`npm test` passed with tests passing (except strictly known PrismaDB local temp PostgreSQL isolation errors unrelated to this audit).

## readyForNextPhase
Yes.
