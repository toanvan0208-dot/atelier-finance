# Macro-to-Industry and Assistant Boundaries

Atelier Finance is an educational platform, not an investment advisory service. As we introduce real macroeconomic data, we must enforce strict guardrails preventing the AI Assistant from generating deterministic investment advice based on macroeconomic conditions.

## 1. Data Ingestion Hierarchy
- **Real Data First**: Macroeconomic data must be verifiably sourced and written to the database with provenance before it can be used in the platform.
- **No Hallucinations**: We never use mock values, hardcoded demo data, or AI-generated estimates for economic indicators in production contexts.
- **Phase 148A**: Defined `db_backed` versus `planned` or `source_assessment_needed` indicators to prevent hallucinating data for newly added macro indicators.
- **Phase 148B**: Locked provider expansion to the 14 indicators currently in the Macro frontend. Added strict stale data policy.
- **Phase 148C**: Verified sources for frontend indicators, strictly enforcing `machine_readable_api` and `providerFetchEligible` to avoid dangerous scraping or unverified manual parses. Assistant explicitly knows which metrics need manual review vs which are candidate/DB-backed.
- **Phase 148D**: Developed a parser strategy indicating which sources have `api_ready` vs `manual_review_only` feasibility. The Assistant is strictly instructed that *parser strategy/feasibility is not data*, preventing it from hallucinating numbers just because a parser is planned.
- **Phase 148E**: Executed parser dry-runs on real sources. Confirmed that candidate preview data generated from these dry-runs does not pollute the DB and the Assistant handles blocked fetches (due to missing/unstable sources) gracefully without inventing data.
- **Phase 148F**: Verified actual source URLs for blocked indicators (USD_VND and INTERBANK_RATE_OVERNIGHT) are reachable. Source URL reachability is strictly separated from observation data, so the Assistant is aware of parser intent but does not invent observations from URL existence.
- **Phase 148G**: Executed parser dry-runs on verified SBV URLs. The parser blocked gracefully due to HTML instability, and the Assistant correctly maintained its guardrail of explicitly stating the data is not available, avoiding any hallucinations.
- **Phase 148H**: Inspected SBV source structure and confirmed HTML instability. Found alternate source (VCB API) for USD_VND. INTERBANK_RATE_OVERNIGHT is blocked for manual review. Assistant is strictly instructed not to treat alternate source discovery as data availability.
- **Phase 148I**: Audited the semantic mapping for "Lãi suất trong nước". The Assistant understands this is a frontend UI card and does not assume any new backend data observation exists just because a mapping review occurred. No data was invented or fetched.
- **Phase 148J**: Finalized the decision to map "Lãi suất trong nước" to `POLICY_RATE`. The Assistant is instructed to treat this as policy rate/lãi suất điều hành. Because `POLICY_RATE` is not DB-backed and has no observations, the Assistant must clearly state that policy rate data is currently unavailable and must not hallucinate interbank or any other interest rate data to fill the gap.
- **Phase 148K**: Verified the SBV source URL for `POLICY_RATE`. Because the source is highly dynamic (Liferay portal) and blocked from automated scraping, no data is available. The Assistant continues to faithfully report the lack of policy rate data.
- **Phase 148L**: Documented the manual review workflow for `POLICY_RATE` and hardened the unavailable state handling. The Assistant guardrail was explicitly updated to ensure the AI reports "Chưa có dữ liệu lãi suất điều hành đã kiểm duyệt" and refrains from any speculative macro-to-industry conclusions or offering investment advice based on missing policy rate data.
- **Phase 148M**: Assessed source strategy for market macro indicators (`MARKET_TRADING_VALUE`, `FOREIGN_NET_FLOW`). Confirmed both lack a formal public endpoint (relying on undocumented SDKs). Blocked them from automated parser dry-run (`missing_source_url`). Updated the Assistant guardrail to explicitly forbid inventing market data, creating trading signals, or turning foreign flow/liquidity into investment advice.
- **Phase 148N**: Finalized the undocumented provider boundary for `MARKET_TRADING_VALUE` and `FOREIGN_NET_FLOW`. Hardened the unavailable state by adding explicit UI copy ("Chưa có dữ liệu giao dịch khối ngoại/thanh khoản đã kiểm duyệt") and ensuring the Assistant strictly reports this missing state without inventing macro-to-industry conclusions.
- **Phase 148O**: Assessed source readiness for global macro indicators (`FED_FUNDS_RATE`, `DXY`, `BRENT_OIL_PRICE`). Identified FRED API as the candidate source, which requires an authentication key (`auth_required`). Blocked from automated fetch to prevent hallucination. Updated Assistant guardrails to explicitly forbid inventing global macro data or deriving investment signals from them if the data is missing.
- **Phase 148P**: The Assistant is strictly instructed: 'Hiện hệ thống chưa có dữ liệu đã kiểm duyệt cho lãi suất Fed, chỉ số USD hoặc giá dầu Brent, nên không kết luận tác động đến ngành hoặc cổ phiếu từ các chỉ số này.' The DXY indicator label in the UI was renamed to "Sức mạnh USD" to accurately reflect the use of the DTWEXBGS proxy instead of the official ICE DXY.

### Phase 149B Vietnam Macro Boundary
- `USD_VND`, `EXPORT_GROWTH`, `CREDIT_GROWTH`, and `PUBLIC_INVESTMENT` source reachability or candidate status is not observation data. If these indicators have no system observation, the Assistant must say the system does not yet have reviewed data for USD/VND exchange rate, exports, credit growth, or realized public investment capital, and must not conclude sector or stock impact from the missing indicators.

### Phase 149C Parser Dry-Run Boundary
- Parser dry-run candidates remain research/manual candidates until reviewed and written through an approved confirm-write phase. The `USD_VND` dry-run candidate uses a Vietcombank commercial bank transfer quote and must not be described as the SBV central exchange rate. `EXPORT_GROWTH` candidates must be described as derived from export value CSV, not directly published growth. `CREDIT_GROWTH` candidates must be described as manually aggregated from SBV/news/publication sources, not official machine-readable SBV CSV. `PUBLIC_INVESTMENT` candidates must be interpreted by unit (`billion_vnd` or `percent_of_plan_ytd`). None of these candidates may be used as a sector or stock conclusion while missing from system observations.

### Strict Data Provenance and Guardrails
- **No Fake Data Rule**: Absolutely no fallback, mock, or hardcoded macro values may be used or passed to the LLM. 
- **Missing Data Fallback**: If `observationDate` or `value` is missing, the Assistant must respond that the system does not yet have data for that indicator.
- **Source Assessment Guardrail**: If an indicator is `html_table_manual_review` or `blocked`, the Assistant knows the data is intentionally withheld pending manual review or data vendor integration.

## 2. Macro-to-Industry Mapping Boundaries
- Any mapping between a macroeconomic indicator (e.g., Interest Rate) and an industry (e.g., Real Estate) is considered an **educational rule**, not a market truth.
- **Prohibited**: The system must NOT map indicators to industries in a way that suggests guaranteed outcomes (e.g., "Interest rates are down, therefore Real Estate will go up").
- **Allowed**: The system MAY map indicators to industries for the purpose of highlighting theoretical relationships (e.g., "Interest rates often affect the cost of borrowing, which is a key driver for the Real Estate sector").
- Mapping logic must be transparent, hardcoded as educational content or explicitly defined by human editors, rather than generated dynamically by AI based on current data.

## 3. Assistant Prompt Wording Guardrails
The Assistant's system prompt must enforce the following wording constraints when discussing macro data:

### Required Phrasing
When answering user questions regarding the macro environment, the Assistant MUST use non-deterministic, educational language:
- "Theo dữ liệu hệ thống..." (According to the system data...)
- "Yếu tố vĩ mô này có thể liên quan đến..." (This macroeconomic factor may relate to...)
- "Cần kiểm tra thêm dữ liệu ngành và doanh nghiệp..." (Further checking of industry and company data is required...)

### Prohibited Phrasing and Concepts
The Assistant is strictly FORBIDDEN from generating:
- Absolute conclusions: "Lãi suất giảm nên ngành X chắc chắn hưởng lợi." (Interest rates dropped so Industry X will definitely benefit.)
- Investment recommendations: "Ngành Y đáng chú ý." (Industry Y is worth paying attention to / buying.)
- Stock picks: "Cổ phiếu Z hấp dẫn." (Stock Z is attractive.)
- Trading signals, buy/sell/hold ratings, or target prices derived from macro data.
- Any wording that replaces the user's decision-making process.

## 4. Enforcement
These boundaries are enforced through:
1. **Schema Separation**: Keeping structured `MacroObservation` data separate from the qualitative `MacroContext`.
2. **Prompt Engineering**: Hardcoding the required and prohibited phrasing directly into the Assistant's system instructions.
3. **Readiness Gates**: Blocking production deployment of any macro module that fails to implement these guardrails.
