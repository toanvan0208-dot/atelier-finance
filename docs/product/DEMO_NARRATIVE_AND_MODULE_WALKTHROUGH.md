# Demo Narrative And Module Walkthrough

## 1. Start From Overview

Open `/workspace?module=overview`.

Demo message:

Atelier Finance starts with Overview so the audience sees the analysis workspace as a guided readiness map, not a recommendation screen. The purpose is to show what evidence exists, what is missing, and which modules need deeper review.

## 2. Explain Cross-Module Readiness Summary

Point to the cross-module readiness summary.

Safe narration:

Overview connects Financials, Valuation, Technical/PVT, Macro, and Industry status in one place. The important point is that a module can be visible without being complete. `productionApproved:false`, source limitations, unit status, and blocked reasons are part of the product experience.

Do not describe Overview as a final investment conclusion.

## 3. Open Financials

Open `/workspace?module=financials`.

Safe narration:

Financials focuses on transparency before calculation. The demo should show data mode, source/evidence status, unit metadata status, missing fields, blocked reasons, and Valuation handoff readiness.

## 4. Explain Source/Unit/Missing-Field Transparency

Safe narration:

Financials makes missing information visible instead of replacing it with zeros. Unit metadata must be explicit before scale-sensitive handoff. The CSV-to-Prisma path has been verified through controlled inline/test/temp DB flows, but that is not a production ingestion path.

Required limitation:

- No production CSV importer yet.
- No public upload UI/API.
- No production-approved data claim.
- Financials CSV-to-Prisma path is verified through controlled inline/test/temp DB flow, not production ingestion.

## 5. Open Valuation

Open `/workspace?module=valuation`.

Safe narration:

Valuation is shown as a readiness and boundary surface. It can explain why inputs are ready, missing, not applicable, or blocked, while keeping source approval and input ownership separate.

## 6. Explain Conditional Readiness And `canClaimValuationDbBacked:false`

Safe narration:

`canClaimValuationDbBacked:false` may remain false because Financials, Market/PVT, units, and source approval are separate boundaries. Financials data alone does not make Valuation fully DB-backed. Missing EPS, equity, shares, market price, market cap, or unknown units can block readiness.

Required limitation:

- Valuation remains bounded and does not provide target price/fair value/recommendation.

## 7. Open Technical/PVT

Open `/workspace?module=technical`.

Safe narration:

Technical/PVT shows price/volume source transparency and Market/PVT unit boundaries. The module can explain whether data is sample/local/research and whether explicit unit metadata exists.

## 8. Explain Source/Unit Boundary And No Trading Signal

Safe narration:

Technical/PVT is source-bounded and educational. It should not be presented as entry/exit advice. Market/PVT unit ownership is separate from Financials, and `productionApproved:false` remains required for local/research/sample data.

Required limitation:

- Technical/PVT does not provide trading signals.

## 9. Open Macro

Open `/workspace?module=macro`.

Safe narration:

Macro currently demonstrates readiness and boundary requirements. It shows that future macro data would need source evidence, unit metadata, as-of/period context, and approval gates before downstream use.

## 10. Explain Macro Readiness Boundary

Safe narration:

Macro has no production source connected yet. The visible readiness panel is useful because it shows what would be required before the module can support deeper analysis.

Required limitation:

- Macro is a readiness/boundary state, not a production data pipeline.

## 11. Open Industry

Open `/workspace?module=industry`.

Safe narration:

Industry follows the same readiness-first pattern. It can show source/evidence gaps, explicit unit requirements, blocked status, and future gates without claiming that production industry data has been connected.

## 12. Explain Industry Readiness Boundary

Safe narration:

Industry has no production source connected yet. The current value is the visible checklist of evidence and unit requirements.

Required limitation:

- Industry is a readiness/boundary state, not a production data pipeline.

## 13. Explain AI/RAG Guardrails If Relevant

If the demo includes AI/RAG, explain it as a source-bounded assistant layer.

Safe narration:

AI/RAG should help explain available evidence, missing context, and next investigation questions. It must not turn readiness, valuation, risk, or Technical/PVT context into recommendation, target, fair value, or trading signal output.

Relevant evidence:

- `ACADEMIC_DATA_BOUNDARY_FOR_AI_DISCLOSURE.md`
- `FINAL_PRODUCT_READINESS_VERIFICATION.md`
- AI/RAG prompt/runtime tests under `src/lib/ai-rag`

## 14. Explain Limitations And Future Work

Close the demo with limitations and gates:

- No production CSV importer yet.
- No public upload UI/API.
- No official/realtime source approval workflow.
- No production-approved data claim.
- Macro/Industry are readiness/boundary states, not production data pipelines.
- Financials CSV-to-Prisma path is verified through controlled inline/test/temp DB flow, not production ingestion.
- Valuation remains bounded and does not provide target price/fair value/recommendation.
- Technical/PVT does not provide trading signals.

Future work gates:

- Controlled local file parser/import trial only after explicit approval.
- Source approval/legal evidence review before `productionApproved` can become true.
- Real data ingestion only with explicit unit metadata and source evidence.
- Browser verification required for UI changes.
- No module may claim official/realtime/production-approved status by default.

## Demo Close

The safest closing sentence is:

Atelier Finance demonstrates a source-bounded productization foundation: it helps users see readiness, limitations, and evidence gaps before forming their own analysis arguments.
