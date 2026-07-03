import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ControlledValuationCalculationPanel } from "../ControlledValuationCalculationPanel";
import { buildControlledValuationIntegrationBoundary } from "../../lib/controlled-valuation-integration-boundary";
import type {
  ControlledValuationFinancialsRuntimeSnapshot,
  ControlledValuationIntegrationBoundary,
} from "../../lib/controlled-valuation-integration-boundary";
import { buildValuationUnitAwareReadyMetricsScenario } from "../../lib/valuation-unit-aware-ready-metrics-scenario";

const renderPanel = (boundary: ControlledValuationIntegrationBoundary = buildControlledValuationIntegrationBoundary()) =>
  renderToStaticMarkup(createElement(ControlledValuationCalculationPanel, { boundary }));

const verifiedRuntime = (
  patch: ControlledValuationFinancialsRuntimeSnapshot,
): ControlledValuationFinancialsRuntimeSnapshot => ({
  asOf: "2024-12-31",
  dataMode: "research_only",
  fallbackUsed: false,
  fiscalYear: 2024,
  period: "2024",
  periodType: "annual",
  productionApproved: false,
  readPath: "local_db",
  runtimeStatus: "db_backed",
  sourceLabel: "phase95_verified_financials_runtime",
  ...patch,
});

describe("ControlledValuationCalculationPanel", () => {
  it("renders the source boundary without raw DB-backed or production approval claims", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          dataMode: "research_only",
          eps: 5,
          readPath: "local_db",
          units: { eps: "vnd_per_share" },
        }),
        persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("Các tỷ số nào đang đọc được?");
    expect(html).toContain("Điều kiện để tin các tỷ số này");
    expect(html).toContain("Tỷ số chỉ là điểm bắt đầu để đặt câu hỏi");
    expect(html).toContain("không phải lời khuyên đầu tư");
    expect(html).not.toContain("sourceMode:mixed_source");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("canClaimValuationDbBacked:false");
  });

  it("renders ready metric values only when status is ready", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          equity: 1000,
          eps: 5,
          sharesOutstanding: 100,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        }),
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("P/E");
    expect(html).toContain("Có thể tính");
    expect(html).toContain(">4<");
    expect(html).toContain("P/B");
    expect(html).toContain(">2<");
  });

  it("renders explicit-unit ready metrics with source guardrails", () => {
    const scenario = buildValuationUnitAwareReadyMetricsScenario();
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          asOf: scenario.financialsRuntimeData.source.asOf,
          dataMode: scenario.financialsRuntimeData.source.dataMode,
          eps: scenario.financialsRuntimeData.statementSnapshot?.eps,
          fallbackUsed: false,
          period: scenario.financialsRuntimeData.statementSnapshot?.period,
          periodType: scenario.financialsRuntimeData.source.periodType,
          revenue: scenario.financialsRuntimeData.statementSnapshot?.revenue,
          runtimeStatus: "db_backed",
          sharesOutstanding: scenario.financialsRuntimeData.statementSnapshot?.sharesOutstanding,
          sourceLabel: scenario.financialsRuntimeData.source.sourceLabel,
          totalEquity: scenario.financialsRuntimeData.statementSnapshot?.totalEquity,
          units: {
            equity: scenario.financialsRuntimeData.unitMetadata.equity.unit,
            eps: scenario.financialsRuntimeData.unitMetadata.eps.unit,
            revenue: scenario.financialsRuntimeData.unitMetadata.revenue.unit,
            sharesOutstanding: scenario.financialsRuntimeData.unitMetadata.sharesOutstanding.unit,
          },
        }),
        persistedValuationInputs: scenario.persistedValuationInputs,
      }),
    );

    expect(html).toContain("Các tỷ số nào đang đọc được?");
    expect(html).toContain("Điều kiện để tin các tỷ số này");
    expect(html).toContain("Có thể tính");
    expect(html).toContain("5.000.000.000");
    expect(html).toContain(">10<");
    expect(html).toContain("5.000");
    expect(html).toContain(">5<");
    expect(html).toContain("Chưa mở");
    expect(html).not.toContain("sourceMode:mixed_source");
    expect(html).not.toContain("financialsSource:financials_input_db_backed_local_imported");
    expect(html).not.toContain("marketSource:market_pvt");
    expect(html).not.toContain("productionApproved:false");
    expect(html).not.toContain("canClaimValuationDbBacked:false");
  });

  it("renders insufficient data reasons without zero-filling missing values", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("Chưa đủ dữ liệu");
    expect(html).toContain("Thiếu EPS");
    expect(html).toContain("Thiếu giá thị trường hoặc số cổ phiếu hợp lệ");
    expect(html).not.toContain(">0 đ");
    expect(html).not.toContain(">0,0");
    expect(html).toContain("cần xem lại");
  });

  it("does not round small positive ready values down to zero", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          equity: 1,
          eps: 5,
          sharesOutstanding: 10_000,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        }),
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain(">0,0001<");
    expect(html).toContain("Các đầu vào bắt buộc đã hợp lệ.");
  });

  it("renders N/A states for non-positive EPS and equity", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          equity: 0,
          eps: -1,
          sharesOutstanding: 100,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        }),
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("N/A");
    expect(html).toContain("EPS không dương");
    expect(html).toContain("Vốn chủ sở hữu không dương");
  });

  it("renders EV, EV/EBITDA, and DCF as blocked without displaying fair-value wording", () => {
    const html = renderPanel();

    expect(html).toContain("EV");
    expect(html).toContain("EV/EBITDA");
    expect(html).toContain("DCF");
    expect(html).toContain("Cần vốn hóa, nợ và tiền mặt rõ trước khi đọc EV.");
    expect(html).toContain("Cần nguồn EBITDA rõ trước khi đọc EV/EBITDA.");
    expect(html).toContain("Cần chuỗi dòng tiền, chi phí vốn và tăng trưởng dài hạn rõ hơn.");
    expect(html.toLowerCase()).not.toContain("fair value");
    expect(html.toLowerCase()).not.toContain("intrinsic value");
  });

  it("does not render forbidden wording", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: verifiedRuntime({
          revenue: 1000,
          equity: 1000,
          eps: 5,
          sharesOutstanding: 100,
          dataMode: "research_only",
          readPath: "local_db",
          units: { equity: "vnd", eps: "vnd_per_share", revenue: "vnd", sharesOutstanding: "shares" },
        }),
        persistedValuationInputs: { marketCap: 10_000, marketPrice: 100, units: { marketCap: "vnd", marketPrice: "vnd_per_share" } },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "nên mua",
      "tín hiệu mua",
      "định giá hấp dẫn",
      "đang rẻ",
      "đáng mua",
      "hấp dẫn",
      "giá mục tiêu",
      "mục tiêu giá",
      "fair value",
      "target price",
      "upside",
      "downside",
      "recommendation",
      "production-ready",
      "production-approved",
    ];

    for (const phrase of blockedPhrases) {
      expect(html).not.toContain(phrase);
    }
  });
});
