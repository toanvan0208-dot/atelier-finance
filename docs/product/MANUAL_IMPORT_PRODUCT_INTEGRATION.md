# Manual Import Product Integration

Date: 2026-06-18

Phase: 28F - Manual Import Product Integration

This phase makes the manual import workspace discoverable from the product while keeping its scope explicit: user-provided CSV data, validation/readiness checks, and Financials/Valuation preview only.

It does not call real APIs, add a database, add backend endpoints, upload binary/XLSX files, replace module data, or make manual upload a production-approved source.

## Integration Point

The integration is a small CTA card on the Overview page:

- title: "Nhập dữ liệu"
- badge: "Dữ liệu thủ công"
- link: `/data-import`
- scope copy: "Dữ liệu này do người dùng cung cấp, không phải nguồn dữ liệu hệ thống đã xác minh."

The sidebar/mobile navigation currently uses internal module keys inside `/workspace`. Because `/data-import` is a standalone route, Phase 28F avoids changing that navigation contract and uses the Overview CTA as the safest product entry.

## User Flow

1. User opens `/workspace` or the Overview module.
2. User sees the "Nhập dữ liệu" CTA card.
3. User opens `/data-import`.
4. User pastes CSV or uses the template.
5. The workspace runs the existing Phase 28A-28E pipeline and renders validation/report/preview output.

## Safety Copy

The Overview CTA states that manual import data is user-provided and not system-verified. The workspace keeps the same warning card and `thesis_verification` runtime mode.

## Remaining Gaps

- Add a dedicated navigation entry only if the shell supports external route links cleanly.
- Add component-level tests when a React DOM test setup exists.
- Keep manual import separate from production runtime until source approval and persistence rules are defined.
