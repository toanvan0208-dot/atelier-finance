# VNSTOCK Market Price Provider Profile

## Provider Name
vnstock

## Provider Status
candidate / undocumented_provider

## Usage Scope
Staging and candidate data only. Not approved for production usage as an official source of truth.

## Supported Data
- Historical daily close price.
- Historical daily volume.
- Supported for the non-banking equities currently in allowlist (FPT, HPG, VNM, MSN, MWG).

## Unsupported Data
- VCB / Banking equities are completely unsupported due to different accounting standards and data shapes.

## Known Assumptions
- The currency is assumed to be `VND`.
- The price unit is assumed to be `vnd_per_share`.
- The volume unit is assumed to be `shares`.
- The exchange is assumed to be `HOSE` based on the supported tickers.

## Known Missing Evidence
- **Adjustment Evidence**: The provider payload lacks explicit fields indicating whether the historical data is adjusted for stock splits or dividends. As a result, the `adjustmentStatus` is `needs_review` and `MISSING_ADJUSTMENT_EVIDENCE` is flagged.

## Known Reliability Limits
- The provider does not offer an official Service Level Agreement (SLA).
- There are no documented API stability guarantees.

## Why it is not production-approved
Due to the lack of official documentation, missing explicit unit metadata, and the absence of adjustment evidence, the provider is classified as `undocumented_provider` with `needsReview=true` and `productionApproved=false`. Furthermore, fetching data from this provider locally requires a TLS workaround (`NODE_TLS_REJECT_UNAUTHORIZED=0`), which is not permitted in a production environment.

## Allowed Environments
- Local development
- Staging (dry-run only)

## Forbidden Claims
- Data from this provider must **never** be presented as official, verified, or production data.
- The assistant must explicitly state that the data is "dữ liệu hiện có" and "chưa được phê duyệt sản xuất".

## Review Requirements Before Production
Before this provider can be approved for production:
1. `MISSING_ADJUSTMENT_EVIDENCE` must be resolved (e.g., via a manual mapping file or another trusted source).
2. A formal documented provider profile with SLA must be established.
3. The `NODE_TLS_REJECT_UNAUTHORIZED=0` workaround must be eliminated or strictly isolated from production.
