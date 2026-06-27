# Phase 144E: Simulation / PaperTrade Read-Path Audit

## Objectives
Audit the Simulation module and the PaperTrade schema to determine the safety and feasibility of moving from static mock data to DB-backed read-paths.

## Inventory of Current Simulation
- **UI Components:** `SimulationPage.tsx` and 30+ child components.
- **Data Source:** Exclusively relies on `src/features/simulation/data/simulation.data.ts` which provides fully mocked data (`simulationExperienceData`) including ticker "PNJ", mock thesis templates, static price/volume assertions, and predefined case study scenarios.
- **PaperTrade Schema:** The `PaperTrade` model exists in `prisma/schema.prisma` but lacks an API route, a runtime helper, and a defined write-path or user session context.
- **Wording/Guardrails:** Current UI includes words like "đầu tư", "phân bổ vốn", but positions it firmly as a "Phòng tập tư duy đầu tư" (investment thinking gym). It strictly avoids "nên mua/bán" or "đáng mua".

## PaperTrade Schema Audit
- **Fields:** `userId`, `companyId`, `ticker`, `action`, `quantity`, `entryPrice`, `exitPrice`, `openedAt`, `closedAt`, `status`, `thesisSnapshot`, `reflection`.
- **Relations:** Belongs to `User` and `Company`.
- **Missing Write-Path:** There is currently no `POST`/`PUT` endpoint, no form action mapped to Prisma `create`, and no assumed `default user`. 
- **Conclusion:** PaperTrade is entirely schema-only. We cannot implement live paper trading in the read-path without first designing the write-path and session management.

## DB/Runtime Field Mapping

| Simulation field | Current mock source | Possible runtime/DB source | Available now? | Missing behavior | Risk |
| --- | --- | --- | --- | --- | --- |
| `current.stock.currentPrice` | `simulation.data.ts` | `marketPriceService.getLatestMarketPrice()` | Yes (Staging) | Return `N/A` | Low |
| `pvt.cards` (PVT Snapshot) | `simulation.data.ts` | `loadTechnicalRuntimeData` | Partial (No volume anomalies yet) | Return `N/A` | Low |
| `positions` (Paper Trades) | `simulation.data.ts` | `PaperTrade` model | No (Schema only) | Fallback to mock / Empty state | Med (Needs write-path) |
| `scenarios` (Case studies) | `simulation.data.ts` | N/A (Static feature) | N/A | Keep static mock | Low (Needs `demo_only` label) |

## Approved Ticker Readiness
Running `scripts/audit-simulation-papertrade-readiness.ts` yielded the following:

```text
Ticker | MarketPrice | TechnicalData | PaperTradeSchema | SimulationReady | MockDependency | Status
FPT    | OK          | OK/PARTIAL    | schema_only      | partial         | yes            | PASS/PARTIAL
HPG    | OK          | OK/PARTIAL    | schema_only      | partial         | yes            | PASS/PARTIAL
VNM    | OK          | OK/PARTIAL    | schema_only      | partial         | yes            | PASS/PARTIAL
MSN    | OK          | OK/PARTIAL    | schema_only      | partial         | yes            | PASS/PARTIAL
MWG    | OK          | OK/PARTIAL    | schema_only      | partial         | yes            | PASS/PARTIAL
VCB    | unsupported | unsupported   | schema_only      | unsupported     | yes            | PASS
```

## VCB Behavior
VCB is accurately excluded by `getLatestMarketPrice(..., { dataMode: "research_only" })`, guaranteeing banking tickers don't accidentally leak into simulation flows.

## UI Smoke Result
Not run (no browser test driver environment available locally for interacting with the `/workspace?symbol=FPT&module=simulation` UI in real-time).

## Guardrail Observations
- The mock data has no "missing-to-zero" logic; it simply hardcodes everything.
- Mock scenarios do not present themselves as real live data, but they lack explicit `demo_only` visual labels.
- The wording strictly adheres to educational simulations ("phòng tập", "mô phỏng", "giả lập").

## Decision
**C. Needs user/session/write-path design first.**
Because `PaperTrade` mandates a `User` session and a safe write-path (DB write operations), we cannot natively integrate real paper trading logic yet. The Simulation module can partially pull market prices, but the core mechanic (placing a simulated trade) remains mock. We should retain it as a demo but clearly label it as `demo_only`, or build the write-path next.

## Validation Results
- `npm run lint` and `npm run typecheck`: Pass
- `npx prisma validate` / `generate`: Pass
- DB write / Data seed / Schema migration / Deploy: No.

## Recommended Next Phase
Either implement the Phase 144F (Learning module DB integration) or implement the User Session and DB Write-Path architecture necessary to fulfill Simulation (Phase 144E.1).

### readyForNextPhase
**Yes.**
