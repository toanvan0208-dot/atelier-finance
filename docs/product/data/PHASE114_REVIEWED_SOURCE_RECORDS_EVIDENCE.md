# Phase 114: Reviewed Source Records Evidence

## Summary of Investigated Sources
For this phase, research was conducted to locate `totalDebt`, `eps`, and `sharesOutstanding` for FPT, MWG, and VNM based on official 2024 financial disclosures.
Primary sources utilized:
- **FPT**: 2024 Audited Consolidated Financial Statements & Annual Report 2024 (via fpt.com.vn).
- **MWG**: 2024 Audited Consolidated Financial Statements & Annual Report 2024 (via tgdd.vn / ir.thegioididong.com).
- **VNM**: 2024 Audited Consolidated Financial Statements & Annual Report 2024 (via vinamilk.com.vn).

Secondary sources (CafeF, Vietstock) were consulted but discarded where they conflicted with official audited filings. The data included in the candidate CSV is strictly derived from official disclosures.

### Guardrail Confirmations
- **Liabilities ≠ Debt**: Total liabilities (nợ phải trả) were explicitly rejected. Only interest-bearing borrowings and finance lease liabilities ("vay và nợ thuê tài chính ngắn hạn/dài hạn") were included in `totalDebt`.
- **No Test Data**: No sample, mock, or test fixtures were used.
- **productionApproved=false**: All records are flagged with `productionApproved: false` and `dataMode: research_only` as they have not gone through a formal legal/source-owner review process.

---

## Detailed Findings per Ticker

### FPT (FPT Corporation)
- **totalDebt**: **Available**. 
  - *Source URL*: https://fpt.com.vn
  - *Line Item*: Vay và nợ thuê tài chính ngắn hạn (Mã 320) + Vay và nợ thuê tài chính dài hạn (Mã 338)
  - *Raw Value*: 14,446,238,451,323 + 501,115,537,075 = 14,947,353,988,398
  - *Raw Unit*: VND
  - *Converted Value*: 14,947.354 (billion_vnd)
  - *Conversion Formula*: raw_vnd / 1,000,000,000
- **EPS**: **Available**.
  - *Source URL*: https://fpt.com.vn
  - *Line Item*: Lãi cơ bản trên cổ phiếu
  - *Raw Value*: 4,944
  - *Raw Unit*: VND/share
  - *Converted Value*: 4,944 (vnd_per_share)
  - *Conversion Formula*: none
- **sharesOutstanding**: **Available**.
  - *Source URL*: https://fpt.com.vn
  - *Line Item*: Số lượng cổ phiếu phổ thông đang lưu hành
  - *Raw Value*: 1,471,069,183
  - *Raw Unit*: shares
  - *Converted Value*: 1,471,069,183 (shares)
  - *Conversion Formula*: none

### MWG (Mobile World Investment Corporation)
- **totalDebt**: **Available**.
  - *Source URL*: https://ir.thegioididong.com
  - *Line Item*: Vay và nợ thuê tài chính ngắn hạn
  - *Raw Value*: 27,300,246,721,779 (Long-term is 0)
  - *Raw Unit*: VND
  - *Converted Value*: 27,300.247 (billion_vnd)
  - *Conversion Formula*: raw_vnd / 1,000,000,000
- **EPS**: **Available**.
  - *Source URL*: https://ir.thegioididong.com
  - *Line Item*: Lãi cơ bản trên cổ phiếu
  - *Raw Value*: 2,546
  - *Raw Unit*: VND/share
  - *Converted Value*: 2,546 (vnd_per_share)
  - *Conversion Formula*: none
- **sharesOutstanding**: **Available**.
  - *Source URL*: https://ir.thegioididong.com
  - *Line Item*: Số lượng cổ phiếu đang lưu hành (Vốn cổ phần đã phát hành trừ cổ phiếu quỹ)
  - *Raw Value*: 1,454,644,497
  - *Raw Unit*: shares
  - *Converted Value*: 1,454,644,497 (shares)
  - *Conversion Formula*: none

### VNM (Vietnam Dairy Products JSC - Vinamilk)
- **totalDebt**: **Available**.
  - *Source URL*: https://www.vinamilk.com.vn/vi/bao-cao-tai-chinh
  - *Line Item*: Vay ngắn hạn + Nợ thuê tài sản ngắn hạn + Vay dài hạn + Nợ thuê tài sản dài hạn
  - *Raw Value*: 9,115,435 + 48,650 + 157,904 + 737,077 = 10,059,066 (triệu VND) -> 10,059,066,000,000 VND
  - *Raw Unit*: VND
  - *Converted Value*: 10,059.066 (billion_vnd)
  - *Conversion Formula*: raw_vnd / 1,000,000,000
- **EPS**: **Available**.
  - *Source URL*: https://www.vinamilk.com.vn/vi/bao-cao-tai-chinh
  - *Line Item*: Lãi cơ bản trên cổ phiếu
  - *Raw Value*: 4,130
  - *Raw Unit*: VND/share
  - *Converted Value*: 4,130 (vnd_per_share)
  - *Conversion Formula*: none
- **sharesOutstanding**: **Available**.
  - *Source URL*: https://www.vinamilk.com.vn/vi/quan-he-co-dong
  - *Line Item*: Số lượng cổ phiếu đang lưu hành
  - *Raw Value*: 2,089,955,445
  - *Raw Unit*: shares
  - *Converted Value*: 2,089,955,445 (shares)
  - *Conversion Formula*: none

---
*Missing fields*: None. All 3 fields were identified successfully for all 3 tickers.
