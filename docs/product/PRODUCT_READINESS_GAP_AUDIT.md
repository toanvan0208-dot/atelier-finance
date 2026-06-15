# Product Readiness Gap Audit

Date: 2026-06-15

Scope: Atelier Finance product readiness review across main user flow, navigation, dashboard, financials, valuation, risk, checklist, Price Volume Time, AI Assistant, missing-data behavior, unfinished controls, demo/static data, safety copy, and beginner UX.

## 1. Executive Summary

Atelier Finance has a coherent product direction and many important foundations are already present: module navigation, a guided analysis flow, financial edge-case handling, AI/RAG runtime layers, guardrail validation, provider modes, and an AI evidence panel.

The product is not yet ready to be presented as a fully real investment-analysis product without qualification. The main gaps are not architectural ambition; they are product completion gaps:

- Several core modules still rely on static or mock-style data.
- Some visible controls are disabled, placeholder, or local-session only.
- Data provenance and freshness are not yet consistent across modules.
- Some copy and component naming can still be misunderstood by beginners as action-oriented trading guidance.
- Persistence for user work is incomplete in checklist, simulation, and watchlist-style flows.

The current system is strongest as a product-grade prototype with a serious AI/RAG safety foundation. To be considered product-ready for a thesis defense, the app should clearly separate sample data from real data, remove or wire unfinished controls, standardize safety copy, and preserve user work across the main analysis flow.

## 2. Critical Findings

### C1. Static and Mock Data Still Drive Core Product Modules

File or area:

- `src/features/screening/data/screeningRedesign.data.ts`
- `src/features/financials/data/financials.data.ts`
- `src/features/financials/data/financialReadingDesk.data.ts`
- `src/features/valuation/data/valuationRefactored.data.ts`
- `src/features/risk/data/riskRedesign.data.ts`
- `src/features/technical/data/pvtObservation.data.ts`
- `src/features/macro/types.ts`
- `src/features/macro/components/MacroBlocks.tsx`
- `src/features/macro/components/MacroOverviewDashboard.tsx`

Issue:

Several modules use static datasets or explicitly mark data as mock, placeholder, or sample data. Screening also tells users that only a small set of sample tickers is available.

Why this affects a real product:

For a real product, users need to know whether they are seeing verified data, sample data, stale data, or unavailable data. If static values are presented without consistent source, timestamp, and data-quality labels, the app can look more reliable than the underlying data pipeline actually is.

Suggested fix:

- Add a unified data-quality banner or chip pattern across all modules.
- Standardize fields such as `source`, `asOf`, `isDemoData`, `isStale`, and `missingFields`.
- In product mode, block or clearly label sample datasets.
- Add one central data-source contract before wiring more real endpoints.

### C2. Visible Placeholder Controls Remain in Main User Paths

File or area:

- `src/components/layout/Topbar.tsx`
- `src/components/layout/RightAssistantPanel.tsx`
- `src/features/simulation/components/CurrentSimulationWorkspace.tsx`
- `src/features/simulation/components/SimulationReflectionBox.tsx`
- `src/features/technical/components/PVTSignalLayers.tsx`
- Watchlist and insight actions noted in `docs/AUDIT_SYSTEM_FLOW.md`

Issue:

Some visible buttons are disabled, marked as coming later, or not fully wired. Examples include topbar actions, simulation follow-up controls, PVT detail controls, AI learning buttons, and watchlist insight actions.

Why this affects a real product:

For beginners, disabled or unfinished controls make the product feel inconsistent. During a thesis/demo review, these controls may raise the question of whether the app is complete or only a UI mock.

Suggested fix:

- Hide nonessential unfinished controls before submission.
- For essential controls, wire the minimum useful behavior.
- If a control must remain disabled, label it as a planned feature and keep it outside the primary path.
- Add a “no dead primary actions” manual QA checklist.

### C3. User Work Is Not Persisted Across Several Core Flows

File or area:

- `src/features/checklist/components/ChecklistPage.tsx`
- `src/features/simulation/components/SimulationPage.tsx`
- Watchlist-related state and static data areas

Issue:

Checklist answers, simulation work, and some watchlist-style interactions appear to depend on local component state or static module data. There is no consistent persistence layer for the user’s analysis progress.

Why this affects a real product:

Atelier Finance is positioned as a guided analysis product. If the user’s work disappears after navigation, refresh, or session changes, the product feels temporary and does not support a real analysis workflow.

Suggested fix:

- Add minimal local persistence first, such as `localStorage`, for checklist answers, simulation notes, and selected case state.
- Later move to a backend profile/workspace store.
- Clearly label any flow that is session-only.

### C4. Safety Copy Is Strong, But Some Product Text Still Uses Action-Oriented Terms

File or area:

- `src/config/aiTutor.config.ts`
- `src/features/technical/components/PVTSignalLayers.tsx`
- `src/features/technical/components/PVTRiskRewardZone.tsx`
- `src/features/valuation/data/valuationRefactored.data.ts`
- `src/features/screening/data/screeningRedesign.data.ts`

Issue:

Many safety messages correctly reject direct investment actions. However, some visible or near-visible wording still uses action-oriented trading terms, especially in PVT, valuation, watchlist, checklist, and learning copy. Even when negated, repeated exposure to these terms can confuse beginners.

Why this affects a real product:

The product rule is that Atelier Finance helps users understand data, not make investment decisions for them. Beginner users may still interpret repeated trading-action vocabulary as a decision framework.

Suggested fix:

- Replace direct trading-action wording in user-facing copy with neutral phrases such as “hành động đầu tư”, “quyết định cá nhân”, or “kết luận hành động”.
- Keep exact restricted phrases inside guardrail docs, tests, and validator patterns only.
- Add a UI copy audit before submission.

### C5. Main Flow Still Depends on Demo-Like Module Boundaries

File or area:

- `src/components/layout/AppShell.tsx`
- `src/components/layout/MainContent.tsx`
- `src/config/navigation.config.ts`
- `src/features/overview/components/OverviewPage.tsx`
- `src/features/simulation/components/SimulationPage.tsx`

Issue:

The app has a strong module map, but some transitions are not fully productized. `route-config` behaves as a drawer rather than a normal page. Simulation does not receive the same navigation callback pattern as most modules. Some modules are part of the journey but not equally represented in internal progress handling.

Why this affects a real product:

The product promise depends on a guided flow. If module transitions are inconsistent, users may not understand where they are, what they completed, or what should happen next.

Suggested fix:

- Define the canonical journey map in one place.
- Ensure every major module has consistent `onNavigate` behavior.
- Make `route-config` either a documented drawer step or a real page.
- Add route-level smoke tests for the main analysis path.

## 3. Important Findings

### I1. AI Assistant Is Well Structured, But Default Mode Does Not Produce an Answer

File or area:

- `src/app/api/assistant/route.ts`
- `src/lib/ai-rag/assistant/`
- `src/lib/ai-rag/providers/`
- `src/components/layout/RightAssistantPanel.tsx`

Issue:

The AI/RAG pipeline is correctly guarded and provider modes are separated. By default, provider mode is safe and does not call an LLM. This is good for safety, but reviewers may expect to see clearly whether the assistant is in context-preparation mode, mock mode, or real provider mode.

Why this affects a real product:

If the assistant visibly prepares context but does not answer, the UI must make that state obvious. Otherwise users may think the assistant failed.

Suggested fix:

- Keep the evidence panel visible.
- Add a compact provider-mode label for local/demo verification.
- Include one documented manual verification run for `none`, `mock`, and configured provider modes.

### I2. Legacy Hardcoded AI Component Remains in the Assistant File

File or area:

- `src/components/layout/RightAssistantPanel.tsx`

Issue:

The active AI tab calls `/api/assistant`, but an older hardcoded ask-tab component remains in the file and is disabled by lint comments.

Why this affects a real product:

Dead code with old answer behavior can confuse maintainers and create risk of accidentally reintroducing fake assistant responses.

Suggested fix:

- Remove the unused legacy component after verifying it is not imported.
- Keep only the API-backed assistant tab.

### I3. Dashboard Is Useful But Dense for Beginners

File or area:

- `src/features/overview/components/OverviewPage.tsx`
- `src/features/overview/data/overviewCase.data.ts`

Issue:

The overview page combines active case context, next action, summaries, warnings, progress, and support panels. It is rich, but may be dense for a first-time user.

Why this affects a real product:

Beginners need a clear “what should I inspect next?” path. Too many panels can make the dashboard feel like a control room rather than a guided learning product.

Suggested fix:

- Make one next step visually primary.
- Move secondary context into collapsible details.
- Add a short “current analysis status” line with source and data freshness.

### I4. Financial Data Quality Handling Exists, But Is Not Yet Uniform Across the Product

File or area:

- `src/features/financials/lib/financialMetrics.ts`
- `src/features/financials/components/MetricExplanationTooltip.tsx`
- `src/features/valuation/`
- `src/features/risk/`
- `src/features/technical/`

Issue:

Financial logic handles important invalid cases such as missing values, invalid denominators, negative EPS, and negative equity. However, the visible data-quality pattern is not yet equally strong in every module.

Why this affects a real product:

Users should not have to infer whether unavailable data means zero, stale data, or insufficient data. The product rule should be visible everywhere, not only in the calculation layer.

Suggested fix:

- Use one shared missing-data display pattern.
- Surface `null`, `not_available`, and `insufficient_data` consistently.
- Show source/timestamp next to module-level conclusions.

### I5. Valuation UI Can Be Misread as a Final Value Unless Framed Carefully

File or area:

- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/data/valuationRefactored.data.ts`

Issue:

The valuation module presents ranges, assumptions, uncertainty, and method outputs. This is useful, but beginners may mistake valuation outputs for a precise target or final answer.

Why this affects a real product:

Valuation should be framed as scenario analysis and assumption checking. It must not look like a decision engine.

Suggested fix:

- Add clearer wording around scenario ranges and uncertainty.
- Show method limitations near the result area.
- If EPS or equity is invalid, make invalid-method status highly visible.

### I6. Risk Score Needs Stronger Context Around Interpretation

File or area:

- `src/features/risk/components/RiskPage.tsx`
- `src/features/risk/data/riskRedesign.data.ts`

Issue:

The risk module contains scores, breakers, and source maps. Even with safety copy, beginners may interpret a score as a final quality label.

Why this affects a real product:

Risk score should be a prioritization and investigation aid, not a conclusion about the stock.

Suggested fix:

- Place a short interpretation boundary next to the score.
- Show top drivers and missing data before any visual score emphasis.
- Add a “what this does not mean” microcopy line.

### I7. PVT Naming and Controls Need a Final Safety Pass

File or area:

- `src/features/technical/components/TechnicalPage.tsx`
- `src/features/technical/components/PVTSignalLayers.tsx`
- `src/features/technical/components/PVTRiskRewardZone.tsx`
- `src/features/technical/data/pvtObservation.data.ts`

Issue:

The PVT module correctly focuses on price, volume, time, liquidity, and observation. However, some component names and UI concepts still use trading-oriented vocabulary.

Why this affects a real product:

PVT is one of the easiest areas for users to mistake observation for action. The UI should repeatedly frame PVT as market context only.

Suggested fix:

- Rename user-facing labels toward “observation layers”, “liquidity context”, and “market behavior”.
- Avoid action-oriented labels in visible copy.
- Keep evidence and limitations close to any chart or status indicator.

### I8. Checklist Has Good Structure But Needs Storage and Clear Output Boundary

File or area:

- `src/features/checklist/components/ChecklistPage.tsx`
- `src/features/checklist/data/checkThinking.data.ts`

Issue:

The checklist flow helps users inspect different dimensions, but answers are local and the output boundary must stay explicit.

Why this affects a real product:

Checklist results can be mistaken for a decision. Also, without persistence, the checklist is less useful as an analysis artifact.

Suggested fix:

- Persist checklist answers locally at minimum.
- Add an export or snapshot option.
- Keep checklist output framed as a structured review, not a decision.

### I9. Search and Notification Controls Are Visible But Not Product Features Yet

File or area:

- `src/components/layout/Topbar.tsx`

Issue:

Search, notification, and account-style controls are visible but disabled.

Why this affects a real product:

Visible but inactive global controls make the product feel incomplete.

Suggested fix:

- Hide them for the submission build, or
- Add a compact “planned” label and remove them from the primary visual hierarchy.

### I10. Manual Product Verification Is Not Yet Centralized

File or area:

- `docs/rag/AI_RAG_ACCEPTANCE_CHECKLIST.md`
- `docs/rag/AI_RAG_THESIS_EVIDENCE_SUMMARY.md`
- `docs/AUDIT_SYSTEM_FLOW.md`

Issue:

There are useful AI/RAG and system-flow verification documents, but there is no single product-readiness checklist tying UI, data, navigation, persistence, safety copy, and AI evidence together.

Why this affects a real product:

For thesis reporting and defense, reviewers need a concise proof that the system was tested as a product, not only as separate modules.

Suggested fix:

- Use this audit as the product-readiness checklist baseline.
- Add a final “verified before submission” table after fixes are made.

## 4. Nice To Have

### N1. Add a Product Mode Banner

File or area:

- `src/components/layout/AppShell.tsx`
- Shared layout components

Issue:

The app could benefit from a small environment-aware banner showing whether it is running with sample data, local data, or real data.

Why this helps:

It makes demos and thesis defense cleaner because the audience immediately understands the current operating mode.

Suggested fix:

- Add a compact banner or badge: sample mode, local mode, or connected mode.

### N2. Add Copy Linting for Restricted Phrases

File or area:

- Test utilities or scripts
- `src/**/*.tsx`
- `src/**/*.ts`

Issue:

Safety-sensitive terms are scattered across UI, data, docs, tests, and guardrails.

Why this helps:

A copy lint script can prevent restricted phrasing from slipping into user-facing surfaces while still allowing it in tests and guardrail files.

Suggested fix:

- Create an allowlist for validator/test files.
- Fail CI when restricted phrases appear in user-facing copy.

### N3. Add E2E Smoke Tests for the Main Journey

File or area:

- `tests/e2e/`
- `src/components/layout/AppShell.tsx`

Issue:

The app has E2E infrastructure, but the product journey should be covered with a small set of acceptance paths.

Why this helps:

It protects navigation, module rendering, AI evidence, and missing-data surfaces from regressions.

Suggested fix:

- Add E2E cases for overview to financials, financials to valuation, PVT to AI assistant, checklist progress, and simulation workspace.

### N4. Add Exportable Analysis Snapshot

File or area:

- Checklist, watchlist, simulation, overview modules

Issue:

The app helps users analyze, but does not yet give them a clean artifact that summarizes what they inspected.

Why this helps:

For a thesis product, an exportable summary makes the system feel more complete and easier to present.

Suggested fix:

- Add a local “analysis snapshot” object first.
- Later support PDF or markdown export.

### N5. Improve Mobile Information Density

File or area:

- `src/components/layout/MobileNavigation.tsx`
- Module pages with dense grids

Issue:

The product has many modules and dense panels. Mobile users may need a clearer progression path.

Why this helps:

Beginners are more likely to get lost on small screens when every module has equal visual weight.

Suggested fix:

- Prioritize the next step.
- Collapse secondary panels by default.
- Keep evidence and warnings visible but compact.

## 5. Module-by-Module Readiness Notes

### Main User Flow

Current status:

The app has a strong guided analysis concept and module map.

Gap:

The journey still needs one canonical path, consistent module transitions, durable user state, and final verification across desktop and mobile.

Recommended next action:

Create a submission-ready path: Overview -> Financials -> Valuation -> Risk -> PVT -> Checklist -> Simulation/Watchlist, with every step either functional or intentionally hidden.

### Navigation

Current status:

Sidebar and mobile navigation exist. URL query navigation is handled by `AppShell`.

Gap:

Some journey steps behave differently from others, especially drawer-based configuration and simulation flow.

Recommended next action:

Normalize navigation callbacks and document drawer-only steps.

### Dashboard / Overview

Current status:

Overview is rich and connects case context, progress, and next action.

Gap:

It can feel dense and may over-rely on static case data.

Recommended next action:

Make data source and next action clearer, and reduce secondary panel prominence.

### Financials

Current status:

Financial edge cases are better handled than many other parts of the product.

Gap:

Data source and freshness are not yet uniformly visible.

Recommended next action:

Standardize source, timestamp, missing-data, and invalid-calculation display.

### Valuation

Current status:

Valuation has assumptions, uncertainty, and method framing.

Gap:

Ranges and method outputs still need stronger “scenario analysis” framing.

Recommended next action:

Make limitations and invalid-method states visible beside the outputs.

### Risk

Current status:

Risk has score, breaker, and source map structure.

Gap:

Score interpretation needs clearer boundaries.

Recommended next action:

Show drivers, missing data, and limitations before letting the score dominate.

### Checklist

Current status:

Checklist has a useful structured review flow.

Gap:

Progress is local and output can be overinterpreted without careful framing.

Recommended next action:

Persist answers and reinforce that checklist is an inspection tool.

### Price Volume Time

Current status:

PVT is positioned around observation, liquidity, and market behavior.

Gap:

Some naming and controls still feel too close to trading-action language.

Recommended next action:

Rename visible concepts toward observation and context, and keep limitations near charts.

### AI Assistant

Current status:

The AI/RAG stack is the most mature technical subsystem: runtime, retrieval, chunking, prompts, providers, guardrails, API route, and evidence panel are present.

Gap:

Default provider mode does not produce an answer, legacy hardcoded component code remains, and product verification should clearly show provider and guardrail states.

Recommended next action:

Remove dead assistant code, keep evidence panel, and run a documented verification pass for safe, blocked, and not-configured states.

## 6. Product Readiness Order

1. Label or gate all sample/static data.
2. Remove or wire unfinished primary controls.
3. Remove legacy hardcoded assistant code.
4. Standardize source, timestamp, and missing-data display across modules.
5. Persist checklist, simulation, and watchlist-style user work.
6. Run a safety copy audit across user-facing UI.
7. Normalize main journey navigation and route behavior.
8. Run `npm test`, `npm run lint`, and targeted E2E/manual verification.
9. Update thesis evidence docs with final product-readiness results.

## 7. Conclusion

Atelier Finance is beyond a simple demo in architecture and product intent, especially because the AI/RAG system includes retrieval, prompt construction, provider abstraction, guardrail validation, and UI evidence. However, the broader application still has product-readiness gaps around data realism, unfinished controls, persistence, and beginner-safe copy.

Current classification:

Product-grade prototype with strong AI/RAG safety foundation, not yet fully product-ready until the critical gaps above are resolved.
