# Phase 156E-fix: Technical/PVT Remove Remaining Unsupported UI Copy

## Goal
Remove or replace remaining unsupported Technical/PVT primary UI copy so the module only presents supported, observation-only data.

## Evidence Checklist
- [x] Removed "Kiểm tra FOMO sâu hơn" and related FOMO cards from the primary UI.
- [x] Removed "Tỷ lệ rủi ro/lợi nhuận theo vùng quan sát" and replaced it with neutral terminology ("Tóm tắt vùng giá tham khảo").
- [x] Replaced occurrences of "hỗ trợ" and "kháng cự" with "vùng giá thấp gần đây", "vùng giá cao gần đây", "vùng giá tham khảo", and "vùng giá trên/dưới".
- [x] Translated leftover English technical copy:
  - "Chart uses active local DB market price series" -> "Biểu đồ dùng dữ liệu giá và khối lượng đã lưu trong hệ thống."
  - "DB-backed" limitations/warnings -> Translated to Vietnamese or removed where redundant.
  - "sample" -> "research" / "fallback" or translated appropriately, removing rendering of "sample" in UI.
- [x] FPT/MSN/VCB remain display-only with fallback data intact but without misleading sample copy.
- [x] Verified zero DB writes, no schema changes, no new metrics, no providers fetched.
- [x] Smoke script `smoke-technical-pvt-relative-market-sector-browser-evidence.ts` passes with strict word checks.

## Verification
```bash
npx tsx scripts/smoke-technical-pvt-relative-market-sector-browser-evidence.ts
```

Output:
```json
{
  "hpgBrowserEvidencePassed": true,
  "vnmBrowserEvidencePassed": true,
  "mwgBrowserEvidencePassed": true,
  "noTickerRoutePassed": true,
  "relativeSectionVisible": true,
  "neutralWordingPassed": true,
  "missingAlignedDateHandled": true,
  "demoCopyDetected": false,
  "fakeMockFallbackAsRealDetected": false,
  "zeroFillDetected": false,
  "benchmarkRankingScoringDetected": false,
  "tradingSignalDetected": false,
  "buySellHoldDetected": false,
  "targetPriceOrFairValueDetected": false,
  "upsideDownsideDetected": false,
  "stockAttractivenessDetected": false,
  "fptMsnVcbRemainDisplayOnly": true,
  "smokePassed": true
}
```

The Technical/PVT module now strictly adheres to its observation-only boundaries without forbidden terminology.
