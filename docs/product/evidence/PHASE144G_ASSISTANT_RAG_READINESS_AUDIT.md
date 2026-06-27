# Phase 144G: Assistant Quality and RAG Readiness Audit

## Starting State
- **Phase 144F.1** completed.
- Core modules DB-backed read paths are integrated. Extended modules are either static helper backed (Checklist, Learning, Screening Readiness) or remain mocked (Simulation).
- Assistant previously received context via `RightAssistantPanel` from UI props. We needed to audit the current level of AI/RAG maturity without deploying vector DB infrastructure yet.

## Assistant Architecture Inventory
- **Route:** `src/app/api/assistant/route.ts` parses the `contextPacket` and delegates to `runAssistant`.
- **Core Runtime:** `src/lib/ai-rag/runtime/build-assistant-runtime.ts` creates the unified prompt, merges missing fields, and evaluates RAG documents.
- **Provider Mode:** Resolved via `src/lib/ai-rag/providers/resolve-assistant-provider.ts` based on `AI_ASSISTANT_PROVIDER`. Supported: `none`, `mock`, `openai`. Default is `none`.
- **RAG Retrieval:** Static document retrieval implemented in `src/lib/ai-rag/retrieval/document-map.ts` (mapping intents to specific static markdown documents). No vector database is used.
- **Guardrails:** Output validation via `src/lib/ai-rag/guardrails/validate-assistant-output.ts`. Pattern matching and dynamic context validations (e.g., cannot call PE cheap if EPS is zero).

## RAG Capability Matrix

| Capability | Exists? | Evidence | Limitation |
|---|---|---|---|
| Intent detection | Yes | `detectUserIntent` | Rule/keyword-based, not semantic |
| Static document retrieval | Yes | `selectRagDocuments` | Retrieves full markdown docs |
| Dynamic semantic retrieval | No | | No vector embedding search |
| Vector DB / pgvector | No | | Infrastructure not configured |
| Chunking/indexing | Partial | `selectRetrievedChunks` | Markdown chunker exists but indexes are static |
| Ranking/filtering | No | | No semantic similarity scores |
| Citation/evidence reference | Yes | `moduleContext` | Grounded to structured UI packet |
| Grounding to module data | Yes | `contextPacket` | Safe pass-through of `missingFields` and `dataQuality` |
| Hallucination refusal | Yes | `validateAssistantOutput`| Refuses fabricated numeric tokens not in context |
| Missing data refusal | Yes | `validateAssistantOutput`| Critical violation if missing data not disclosed |
| Guardrail validator | Yes | `FORBIDDEN_PATTERNS` | Blocks buy/sell/hold/target price logic |

## Current Classification
**Partial RAG with static retrieval / Context-grounded Assistant**. 
It is *not* a production-ready full RAG system due to the absence of a vector database and dynamic semantic retrieval, but it is context-aware and guardrail-enforced.

## Audit Script Results
Script: `scripts/audit-assistant-rag-readiness.ts`
- **Context Packet & RAG Docs:** Questions trigger appropriate intents (e.g., "FPT có EPS nghĩa là gì?" -> `valuation`) and fetch relevant docs (`rag_valuation_knowledge`, `ai_hallucination_checklist`, etc.).
- **Missing Data Context:** Correctly flags and requires disclosure when fields like `totalDebt` are missing.
- **Guardrail Validator:** successfully rejected outputs like:
  - "Tôi khuyên bạn nên mua cổ phiếu MWG." -> `BUY_SELL_HOLD_RECOMMENDATION` (Critical)
  - "Giá mục tiêu của HPG là 35000." -> `FAKE_FAIR_VALUE_OR_TARGET_PRICE` (Critical)
  - "Với EPS này, P/E đang ở mức rất rẻ và hấp dẫn." (when EPS=0) -> `INVALID_PE_INTERPRETATION` (Critical)
- **Live LLM calls:** None (0).
- **Mock Provider Smoke:** Pass (returned safe mock string).

## Data Quality & Validation
- **DB Write:** No
- **Data Seed/Import:** No
- **Schema Migration:** No
- **Rollback:** No
- **Production Deploy/Import:** No
- **Validation Result:** Validated (Typecheck, lint, build pass).

## Known Gaps / Limitations
- Full dynamic vector RAG is missing (requires `pgvector` or external vector DB).
- `detectUserIntent` relies on basic keyword parsing rather than LLM routing.
- Context window could explode if static docs grow too large without semantic chunk filtering.

## Recommended Next Phase
Phase 145 - Proceed with core transition / staging smoke tests. The assistant is safely mocked/guarded and does not block module rollouts.

### readyForNextPhase
**Yes.**
