# External Repo Integration Audit

Date: 2026-06-16

External audit clones:

- `../external-audit/valky-atelier-finance`
- `../external-audit/pttuan-atelier-finance-main`

Main repository status at audit start:

- Branch: `main...origin/main`
- Untracked local logs: `.next-dev.err.log`, `.next-dev.log`
- No code merge, cherry-pick, package install, commit, push, or external script execution was performed.

## 1. Mục tiêu audit

Mục tiêu của Phase 26A là đánh giá khả năng tận dụng hai repo phụ để hỗ trợ productization cho Atelier Finance, không phải merge trực tiếp. Audit tập trung vào dữ liệu thật, nguồn dữ liệu, data dictionary, data quality rules, legal/data usage notes, backend API, database schema, deployment, test/report docs và mức độ phù hợp với hướng sản phẩm giáo dục tài chính an toàn.

Kết quả của phase này chỉ dùng để ra quyết định: phần nào có thể tham khảo, phần nào cần rewrite theo data contract mới, phần nào không nên dùng.

## 2. Nguyên tắc bảo vệ repo chính

- Repo chính là source of truth.
- Không copy đè từ repo phụ vào repo chính.
- Không merge trực tiếp, không cherry-pick, không thay thế `src/`, `docs/`, `database/`, `app/`, `components/`.
- Mọi tích hợp sau này phải đi qua data contract, adapter, safety rules và test.
- Dữ liệu thiếu phải giữ là `null`, `not_available`, `insufficient_data` hoặc `not_applicable`; không dùng `0` thay cho missing data.
- Không làm yếu AI/RAG guardrails, DataQualityBanner, local persistence, provider/runtime, safety copy hoặc financial-logic tests.
- Không đưa API key, token, secret hoặc `.env` thật vào repo.

## 3. Tổng quan 2 repo phụ

| Repo | Vai trò tiềm năng | Điểm mạnh | Rủi ro chính | Kết luận sơ bộ |
| ---- | ----------------- | --------- | ------------ | -------------- |
| `valky217/atelier-finance` | Data/data-quality/data-source research | Có `data/` thật, data docs, data dictionary, legal notes, 14 mã VN, OHLCV, macro, BCTC Excel | Script gọi nguồn web/private API, ghi vào `d:\KLTN`, có logic fallback OHLC thiếu thành `0`, legal risk cao cho commercial use, CPI có duplicate period | Hữu ích làm research input cho Phase 26B/26C, không copy script hoặc data thẳng vào product |
| `pttuan24/atelier-finance-main` | Backend/database/deployment reference | Có Supabase schema, API docs, API route design, RLS cho user tables, deployment/test docs | Demo data, fair-value fields, service role key dependency, frontend cũ hơn repo chính, docs có hướng dẫn `git add .`, schema chưa map đầy đủ với financial-logic contract | Hữu ích làm reference cho backend/database/deployment, cần rewrite theo contract và guardrails repo chính |

## 4. Audit repo valky217/atelier-finance

### Cấu trúc thư mục

Top-level gồm:

- `data/`
- `DATA_SOURCES.md`
- `DATA_DICTIONARY.md`
- `DATA_QUALITY_RULES.md`
- `DATA_SCOPE_V1.md`
- `LEGAL_DATA_NOTES.md`
- `download_real_data.py`
- `README.md`

Repo này không phải frontend/backend app hoàn chỉnh. Nó là bộ dữ liệu, tài liệu nguồn dữ liệu và script thu thập.

### Data files

`data/` có dữ liệu đáng chú ý:

- `industries.csv`: 4 rows
- `stocks.csv`: 14 rows
- `stock_prices.csv`: 18,957 rows
- `macro_ty_gia.csv`: 1,583 rows
- `macro_gdp.csv`: 21 rows
- `macro_cpi.csv`: 64 rows
- `macro_lai_suat.csv`: 66 rows
- `macro_indicators.csv`: 1,734 rows
- `macro_indicators.xlsx`
- `data/BCTC/*.xlsx`: báo cáo năm/quý cho 14 mã như VCB, TCB, MBB, CTG, FPT, CMG, VGI, HPG, HSG, NKG, VHM, VIC, NLG, DXG.

Phạm vi phù hợp với thị trường Việt Nam, gồm ngân hàng, công nghệ, thép và bất động sản.

Kết quả kiểm tra nhanh:

- `stock_prices.csv` không có row OHLC bằng `0` trong snapshot hiện tại.
- `macro_cpi.csv` có duplicate period `2024-05` với 2 rows, cần rule dedupe/source reconciliation.
- Dữ liệu có `nguon_du_lieu` và `ngay_thu_thap`, hữu ích cho source attribution.

### Data source docs

`DATA_SOURCES.md` liệt kê KBSec, Trading Vietcap, Investing.com, Vietstock, SBV và có phân loại loại dữ liệu/tần suất/chi phí. Đây là tài liệu tốt để chuyển hóa thành source registry hoặc data-source evaluation doc.

Điểm cần kiểm chứng thêm:

- Terms of use và quyền thương mại của từng nguồn.
- Việc dùng undocumented/private API của KBSec/Vietstock/Investing.com.
- Quyền redistributing dữ liệu được commit trong public repo.

### Data dictionary

`DATA_DICTIONARY.md` mô tả schema CSV cho:

- `industries.csv`
- `stocks.csv`
- `stock_prices.csv`
- `BCTC/`
- `macro_indicators`

Giá trị cao nhất là danh mục field tiếng Việt rõ ràng, source URL, collection timestamp và period format. Tuy nhiên, chưa phải contract typed cho frontend/backend hiện tại. Cần map sang contract của repo chính, ví dụ `ma_co_phieu` -> `ticker`, `gia_dong_cua_vnd` -> `closePrice`, `nguon_du_lieu` -> source metadata.

### Data quality rules

`DATA_QUALITY_RULES.md` có nhiều rule phù hợp repo chính:

- Giá cổ phiếu phải dương, volume không âm, high >= low, unique ticker/date.
- Missing financial data phải là `null` hoặc blank, không tự điền `0`.
- EPS âm thì P/E không được hiểu là rẻ.
- CFO được phép âm, không ép dương hoặc đưa về `0`.
- Macro indicator unique theo period và chuẩn hóa đơn vị.

Các rule này tương thích mạnh với `docs/financial-logic/*`, `src/lib/financial-logic/*`, AI/RAG guardrails và DataQualityBanner của repo chính.

### Legal/data usage notes

`LEGAL_DATA_NOTES.md` là tài liệu quan trọng. Nó tự nhận diện rủi ro:

- Web scraping có thể vi phạm ToS.
- Undocumented/private APIs có thể bị chặn hoặc thay đổi.
- Academic/educational use khác commercial use.
- Commercial product có rủi ro rất cao nếu không mua quyền dữ liệu hoặc không có thỏa thuận cấp phép.

Tài liệu này nên được dùng làm input cho legal/data usage review, không xem là phê duyệt pháp lý.

### Scripts

`download_real_data.py` có các nguồn và hành vi:

- KBSec endpoint `https://kbbuddywts.kbsec.com.vn/iis-server/investment/stocks/{ticker}/data_day`
- Vietstock endpoint `https://finance.vietstock.vn/data/reportdatatopbynormtype`
- Investing.com economic-calendar pages qua `__NEXT_DATA__`
- SBV interest-rate timeline được hardcode theo mốc ngày trong script
- Ghi output vào absolute path `d:\KLTN`
- Dùng `requests`, `pandas`, `BeautifulSoup`, `openpyxl`

Rủi ro kỹ thuật:

- Không chạy trong repo chính nếu chưa rewrite.
- Không có rate-limit policy chính thức ngoài `sleep`.
- Không có adapter contract, retry/backoff/source status chuẩn hóa.
- Trong code, khi row thiếu key OHLC/volume, giá trị fallback là `0`. Dù snapshot hiện tại không có OHLC `0`, logic này vi phạm nguyên tắc missing-data của repo chính.
- `COLLECTED_AT` hardcoded là `2026-06-13 17:44:45`.
- Lãi suất SBV được xây dựng từ mốc hardcoded, không verify tự động từ nguồn SBV.

### Rủi ro

- Legal/commercial risk cao nếu dùng trực tiếp nguồn hoặc dữ liệu.
- Dữ liệu trong public repo có thể không được phép redistribution.
- Chưa có license rõ cho data.
- Một số period/data quality issue như duplicate CPI.
- Script không production-ready và không phù hợp runtime Next.js hiện tại.
- Field names tiếng Việt tốt cho research nhưng cần adapter.

### Phần có thể tái sử dụng

- Data source inventory.
- Data dictionary ở mức concept.
- Data quality rules về missing/null, EPS âm, CFO âm, high/low, unique period.
- Data scope cho pilot Việt Nam 10-15 mã.
- Legal notes làm checklist kiểm tra license/ToS.

### Phần cần rewrite

- `download_real_data.py` thành ingestion adapter có source contract, null handling, dedupe, rate-limit, source status, error taxonomy và tests.
- CSV/Excel import vào typed normalized schema.
- Macro period handling và duplicate resolution.
- Source registry thành tài liệu/product contract chính thức.

### Phần không nên dùng

- Không copy trực tiếp `data/` vào repo chính.
- Không chạy hoặc đưa nguyên script vào product.
- Không dùng dữ liệu để hiển thị như live/verified data nếu chưa kiểm tra license/source freshness.
- Không dùng fallback missing -> `0`.

## 5. Audit repo pttuan24/atelier-finance-main

### Cấu trúc thư mục

Top-level gồm:

- `database/`
- `src/`
- `BACKEND_API_DOCS.md`
- `DATABASE_SETUP.md`
- `DEPLOYMENT_GUIDE.md`
- `TEST_REPORT.md`
- `.env.example`
- `package.json`
- `README.md`
- design/prototype files

Repo này là app Next.js/Supabase prototype với backend API, schema và deployment docs.

### Backend/API docs

`BACKEND_API_DOCS.md` mô tả các endpoints:

- `GET /api/stocks`
- `GET /api/stocks/[ticker]`
- `GET /api/stocks/[ticker]/prices`
- `GET /api/stocks/[ticker]/financials`
- `GET /api/stocks/[ticker]/ratios`
- `GET /api/stocks/[ticker]/valuation`
- `GET /api/stocks/[ticker]/risk`

Route implementation dùng Next.js App Router API Routes và `supabaseAdmin`. Các routes có validation cơ bản cho ticker, limit, year, period type, scenario và risk level. Response convention `{ data, error, meta? }` đơn giản và dễ map.

Điểm cần lưu ý:

- API dùng Supabase service role trong server route. Đây là đúng hướng server-side, nhưng cần audit kỹ secret handling và authorization before production.
- Endpoint valuation trả `fair_value_low/base/high`. Repo chính không được tự tạo fair value/target price khi thiếu dữ liệu, nên phần này chỉ dùng sau khi có valuation-readiness contract và data-quality warnings.
- Type `RiskAssessment` trong client không khớp hoàn toàn schema route/schema: client type có `price_volatility_score`, `leverage_risk_score`, `governance_risk_score`, trong khi schema/route có `financial_risk_score`, `debt_risk_score`, `business_risk_score`, `transparency_risk_score`, `data_quality_risk_score`. Cần rewrite contract.

### Database schema

`database/schema.sql` có bảng:

- `data_sources`
- `industries`
- `stocks`
- `stock_prices`
- `financial_reports`
- `financial_ratios`
- `macro_indicators`
- `valuation_results`
- `risk_assessments`
- `profiles`
- `watchlists`
- `checklist_results`
- `investment_journals`
- `simulation_trades`
- `rag_documents`
- `rag_chunks`
- `rag_query_logs`

Điểm mạnh:

- Có unique constraints cho ticker, price by stock/date, financial report period, financial ratios period, macro indicator period, valuation result, risk assessment.
- Có check constraints cho price non-negative, high >= low, fiscal quarter, scenario, risk level, trade type.
- Có views `latest_stock_prices`, `latest_financial_reports`, `stock_overview`.
- Có index files cho common queries.

Điểm cần sửa:

- `stock_prices_non_negative` dùng `>= 0`. Với missing data, column nullable là đúng, nhưng import adapter phải đảm bảo missing không thành `0`.
- Chưa có data quality fields như `source_status`, `is_mock`, `as_of`, `stale_status`, `missing_fields`, `confidence`.
- Financial schema còn giản lược, chưa map đầy đủ với `src/lib/financial-logic/types.ts` của repo chính.
- RAG tables là storage idea, không thay thế RAG runtime contract hiện có.

### Deployment docs

`DEPLOYMENT_GUIDE.md` hữu ích cho Vercel/Supabase checklist và env setup. Tuy nhiên có đoạn hướng dẫn `git add .`, commit, push trong repo phụ. Không được áp dụng nguyên văn trong repo chính, đặc biệt Phase 26A cấm commit/push và cấm `git add .`.

Deployment URL trong docs là project cá nhân của repo phụ, chỉ là evidence của repo phụ, không liên quan production của repo chính.

### Env/config

`.env.example` chỉ chứa tên biến:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Không thấy secret thật trong `.env.example`. Cần giữ nguyên nguyên tắc không commit `.env.local` và không expose service role key client-side.

### Tests/reports

`TEST_REPORT.md` ghi nhận backend/database/API/frontend integration pass và build pass, nhưng đây là self-report của repo phụ, không thay thế test suite repo chính. Repo chính hiện đã có Vitest/Playwright tests, AI/RAG tests, financial-logic tests và product readiness verification riêng.

### Frontend overlap

Repo phụ có `src/` và UI components nhưng repo chính đã phát triển xa hơn:

- Có DataQualityBanner.
- Có AI/RAG runtime, prompt builder, retrieval docs, provider/guardrail tests.
- Có local persistence cho checklist/simulation/watchlist.
- Có nhiều module nâng cấp hơn: overview, business, financials, valuation, risk, technical/PVT, screening, watchlist, simulation, checklist, learning, route config.

Không nên lấy frontend/components từ pttuan repo.

### Rủi ro

- Demo seed data có valuation results và fair-value outputs; nếu copy thẳng dễ bị hiểu thành định giá thật.
- Seed docs nói rõ demo data, nhưng API layer chưa bắt buộc trả data-quality metadata.
- Schema/API chưa enforce guardrails về EPS <= 0, equity <= 0, fair value missing-data readiness.
- Service role usage cần threat model.
- Client/server contract mismatch ở risk fields.

### Phần có thể tái sử dụng

- API route shape as reference.
- Supabase schema outline.
- RLS pattern for user-owned tables.
- Views/indexes concept.
- Deployment checklist and env variable list.
- Validation query idea.

### Phần cần rewrite

- Database schema theo data contract repo chính.
- API response contract với `dataQuality`, `source`, `asOf`, `isMockData`, `missingFields`, `warnings`.
- Valuation/risk endpoints để không trả hoặc diễn giải fair value khi data insufficient.
- User persistence model nếu chuyển từ local-only sang Supabase.
- RAG storage tables nếu thật sự cần, theo existing RAG runtime contract.

### Phần không nên dùng

- Không copy `src/` hoặc UI components.
- Không copy `package-lock.json`.
- Không copy seed demo data vào production path.
- Không copy valuation fair-value examples vào user-facing real-data output.
- Không áp dụng deployment docs bằng `git add .`.

## 6. Reuse Classification

| Nguồn | File/thư mục | Phân loại | Giá trị | Rủi ro | Cách tích hợp an toàn |
| ----- | ------------ | --------- | ------- | ------ | --------------------- |
| valky | `DATA_SOURCES.md` | Reuse after audit | Source inventory cho data-source research | Terms/license chưa xác minh | Chuyển hóa thành source registry, thêm license/ToS status |
| valky | `DATA_DICTIONARY.md` | Reuse after audit | Field mapping ban đầu cho CSV/BCTC/macro | Chưa typed theo repo chính | Rewrite thành data contract TypeScript/SQL docs |
| valky | `DATA_QUALITY_RULES.md` | Can reuse now | Rules phù hợp: null missing, EPS âm, CFO âm, high/low, unique period | Cần align wording với docs chính | Import ý tưởng vào Phase 26B docs, không copy code |
| valky | `LEGAL_DATA_NOTES.md` | Reuse after audit | Legal risk checklist rất hữu ích | Không phải legal approval | Dùng làm input cho legal/data usage review |
| valky | `DATA_SCOPE_V1.md` | Reuse after audit | Pilot scope 14 mã VN | Có lỗi nhỏ như `THOSE` cho VIC trong table | Chuẩn hóa ticker/exchange và pilot scope |
| valky | `data/*.csv`, `data/BCTC/*.xlsx` | Reuse after audit | Real-data sample for adapter testing | License/redistribution/staleness/duplicate CPI | Chỉ dùng local audit/sample sau license review; label source and as-of |
| valky | `download_real_data.py` | Needs rewrite | Cho biết endpoints/parsing approach | Missing fallback to `0`, private API, absolute path, rate/legal risk | Rewrite adapter from scratch with source contract, nulls, tests |
| pttuan | `BACKEND_API_DOCS.md` | Reuse after audit | Endpoint reference and response shape | Lacks data-quality contract | Rewrite API contract before implementation |
| pttuan | `database/schema.sql` | Needs rewrite | Useful Supabase starting schema | Not mapped to current financial-logic/DataQuality contract | Design new schema/migrations based on main repo contracts |
| pttuan | `database/rls_policies.sql` | Reuse after audit | User-owned table RLS pattern | Needs auth model decision | Reuse concept after user account scope decision |
| pttuan | `database/indexes.sql`, `views.sql` | Reuse after audit | Query optimization/views pattern | Depends on final schema | Recreate indexes/views after schema design |
| pttuan | `database/checks/validation_queries.sql` | Reuse after audit | Data validation query idea | Coverage incomplete | Expand into data-quality SQL/test suite |
| pttuan | `database/seed/seed_demo_data.sql` | Do not reuse / risky | Demo only | Fake/fair-value data can be mistaken as real | Do not import; create explicit mock fixtures if needed |
| pttuan | `.env.example` | Can reuse now | Env names are useful | Service role must stay server-only | Align with final backend env contract |
| pttuan | `DEPLOYMENT_GUIDE.md` | Reuse after audit | Vercel/Supabase checklist | Contains commands forbidden in this phase | Extract checklist, remove repo-specific commands |
| pttuan | `TEST_REPORT.md` | Reuse after audit | Test/report format reference | Self-report, not authoritative | Use as checklist inspiration only |
| pttuan | `src/`, UI components | Do not reuse / risky | Older prototype | Would regress main repo UI/safety/local persistence | Do not copy; only inspect API patterns |

## 7. Không được merge trực tiếp những gì

Không được copy thẳng:

- Toàn bộ `src/` từ repo phụ.
- Toàn bộ UI components.
- `package-lock.json` nếu khác stack hoặc dependency graph.
- `.env`, `.env.local`, secret files.
- Generated files, build outputs, logs.
- `data/` từ valky nếu chưa xác minh license/source usage.
- `download_real_data.py` hoặc scripts chưa rewrite theo contract.
- Database migrations/schema nếu chưa map với financial logic, data quality, safety and user auth model.
- Demo seed data, đặc biệt valuation/fair-value examples.
- Bất kỳ code nào làm yếu guardrails, AI/RAG runtime, provider safety, DataQualityBanner, local persistence hoặc investment-safety copy.

## 8. Lộ trình tích hợp đề xuất

Phase 26B: Import/align data documentation nếu phù hợp.

- Chuyển hóa source inventory, data dictionary, data quality rules, legal notes thành docs của repo chính.
- Không import data/code.
- Thêm license/ToS verification status per source.

Phase 26C: Real Data Source Contract.

- Định nghĩa source registry, allowed usage, update frequency, as-of, stale rules, source confidence, missing data semantics.
- Chốt rule missing -> null/not_available/insufficient_data.

Phase 27: Data adapter layer.

- Rewrite adapters cho price, financial statements, macro.
- Có tests cho null handling, duplicate periods, stale data, source errors, EPS/equity rules.

Phase 28: Internal API layer.

- Thiết kế API response typed theo main repo: `data`, `dataQuality`, `source`, `warnings`, `missingFields`.
- Không trả fair value/target price khi thiếu input hoặc readiness thấp.

Phase 29: Real data integration pilot.

- Pilot nhỏ với vài ticker, DataQualityBanner bắt buộc, source attribution rõ.
- So sánh output với fixtures và manual checks.

Phase 30: Database/user persistence decision.

- Quyết định Supabase/Postgres scope cho watchlist/checklist/simulation.
- Nếu có user accounts, thiết kế RLS/auth trước khi migrate khỏi local-only persistence.

## 9. Quyết định đề xuất

- Repo `valky217/atelier-finance` nên dùng chủ yếu cho data/data-quality/data-source research. Giá trị mạnh nhất là data source inventory, data dictionary, quality rules, legal risk notes và real-data sample scope cho Việt Nam.
- Repo `pttuan24/atelier-finance-main` nên dùng chủ yếu cho backend/database/deployment reference. Giá trị mạnh nhất là Supabase schema outline, API route pattern, RLS concept, validation queries và deployment checklist.
- Không nên dùng trực tiếp frontend từ repo phụ nào. Repo chính đã đi xa hơn về product direction, AI/RAG, guardrails, DataQualityBanner, local persistence và neutral investment-safety copy.
- Không nên dùng trực tiếp `download_real_data.py`, seed demo data, valuation fair-value examples, package locks hoặc env files.
- Cần đọc kỹ hơn trước khi dùng thật: source terms/license, redistribution rights, KBSec/Vietstock/Investing access rules, Vietcap financial statement usage, and final data contract mapping.

## 10. Checklist trước khi tích hợp thật

- Đã xác minh nguồn dữ liệu?
- Đã kiểm tra license/terms cho academic, internal demo, commercial use và redistribution?
- Đã định nghĩa data contract?
- Đã có adapter?
- Đã có missing-data handling không dùng `0`?
- Đã có duplicate/stale/source-error rules?
- Đã có tests cho EPS <= 0, equity <= 0, null propagation, high/low, unique period?
- Đã không làm yếu safety copy/guardrails?
- Đã không phá UI evidence/data-quality banner?
- Đã không tạo fair value/target price khi thiếu dữ liệu?
- Đã có source attribution và `asOf`?
- Đã có rollback plan?

