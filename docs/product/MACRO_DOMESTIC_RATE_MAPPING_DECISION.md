# Macro Domestic Rate Semantic Mapping Decision

## Context
The Macro frontend has a predefined, locked card labeled **"Lãi suất trong nước"** (domestic-rate).
Previously, this card was mapped directly to the backend indicator `INTERBANK_RATE_OVERNIGHT`.

## Issue
The label "Lãi suất trong nước" is a broad term that can represent various interest rates, including:
- Lãi suất liên ngân hàng qua đêm (Interbank rate overnight)
- Lãi suất điều hành (Policy rate)
- Lợi suất trái phiếu chính phủ (Gov bond yield)
- Lãi suất huy động (Deposit rate)
- Lãi suất cho vay (Lending rate)

`INTERBANK_RATE_OVERNIGHT` is very specific and its source (SBV HTML) is currently blocked due to instability.

## Candidates & Semantic Fit
1. **POLICY_RATE**
   - **Fit**: Strong. Represents the central bank's monetary policy stance which sets the tone for "lãi suất trong nước".
   - **Source**: SBV (HTML/PDF parsing required, candidate source).
2. **INTERBANK_RATE_OVERNIGHT**
   - **Fit**: Medium/Weak for a general audience. Too specific.
   - **Source**: Blocked.
3. **GOV_BOND_YIELD_10Y**
   - **Fit**: Medium. Represents long term capital cost, not retail/corporate rates.
   - **Source**: HNX (Difficult to extract).
4. **DEPOSIT_RATE** / **LENDING_RATE**
   - **Fit**: Medium. Highly relevant to retail investors.
   - **Source**: Unsupported. No standardized free aggregation source.

## Decision (Phase 148J-148L)
**Recommendation**: `replace_current_mapping` -> **`POLICY_RATE`**

After product review in Phase 148J, `POLICY_RATE` was selected as the representative indicator for the "Lãi suất trong nước" frontend card because it best reflects the central bank's monetary policy stance, fitting the broad macroeconomic scope of the dashboard.

- **Trạng thái thực thi**:
  - Giao diện người dùng ("Lãi suất trong nước") chính thức được map với `POLICY_RATE`.
  - `POLICY_RATE` được xác nhận là `dbBacked=false`, `productionApproved=false`, và `needsReview=true`. Không có dữ liệu nào được fetch hoặc lưu trữ vào DB.
  - Phase 148K verified source (SBV), kết quả là `html_dynamic_or_unstable` nên parser bị block.
  - Phase 148L thiết lập ranh giới manual-review: Không có observation = trạng thái unavailable. AI Assistant được cung cấp fallback copy rõ ràng để tránh suy diễn.
