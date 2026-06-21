import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ControlledValuationCalculationPanel } from "../ControlledValuationCalculationPanel";
import { buildControlledValuationIntegrationBoundary } from "../../lib/controlled-valuation-integration-boundary";
import type { ControlledValuationIntegrationBoundary } from "../../lib/controlled-valuation-integration-boundary";
import { buildValuationUnitAwareReadyMetricsScenario } from "../../lib/valuation-unit-aware-ready-metrics-scenario";

const renderPanel = (boundary: ControlledValuationIntegrationBoundary = buildControlledValuationIntegrationBoundary()) =>
  renderToStaticMarkup(createElement(ControlledValuationCalculationPanel, { boundary }));

describe("ControlledValuationCalculationPanel", () => {
  it("renders the source boundary without DB-backed or production approval claims", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          dataMode: "research_only",
          eps: 5,
          readPath: "local_db",
          units: { eps: "vnd_per_share" },
        },
        persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("sourceMode:mixed_source");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("canClaimValuationDbBacked:false");
    expect(html).toContain("valuation_remains_mixed_source");
  });

  it("renders ready metric values only when status is ready", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          equity: 1000,
          eps: 5,
          sharesOutstanding: 100,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        },
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("P/E");
    expect(html).toContain("ready");
    expect(html).toContain(">4<");
    expect(html).toContain("P/B");
    expect(html).toContain(">2<");
  });

  it("renders Phase 71 synthetic explicit-unit ready metrics with source guardrails", () => {
    const scenario = buildValuationUnitAwareReadyMetricsScenario();
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          dataMode: scenario.financialsRuntimeData.source.dataMode,
          eps: scenario.financialsRuntimeData.statementSnapshot?.eps,
          revenue: scenario.financialsRuntimeData.statementSnapshot?.revenue,
          sharesOutstanding: scenario.financialsRuntimeData.statementSnapshot?.sharesOutstanding,
          sourceLabel: scenario.financialsRuntimeData.source.sourceLabel,
          totalEquity: scenario.financialsRuntimeData.statementSnapshot?.totalEquity,
          units: {
            equity: scenario.financialsRuntimeData.unitMetadata.equity.unit,
            eps: scenario.financialsRuntimeData.unitMetadata.eps.unit,
            revenue: scenario.financialsRuntimeData.unitMetadata.revenue.unit,
            sharesOutstanding: scenario.financialsRuntimeData.unitMetadata.sharesOutstanding.unit,
          },
        },
        persistedValuationInputs: scenario.persistedValuationInputs,
      }),
    );

    expect(html).toContain("sourceMode:mixed_source");
    expect(html).toContain("financialsSource:financials_runtime_partial");
    expect(html).toContain("marketSource:market_pvt");
    expect(html).toContain("productionApproved:false");
    expect(html).toContain("canClaimValuationDbBacked:false");
    expect(html).toContain("valuation_remains_mixed_source");
    expect(html).toContain("5,000,000,000");
    expect(html).toContain(">10<");
    expect(html).toContain("5,000");
    expect(html).toContain(">5<");
    expect(html).toContain("blocked");
    expect(html).not.toContain(">0<");
  });

  it("renders insufficient data reasons without zero-filling missing values", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        persistedValuationInputs: { marketPrice: 100, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("insufficient_data");
    expect(html).toContain("missing eps");
    expect(html).toContain("missing valid market price or shares");
    expect(html).toContain("unavailable");
    expect(html).not.toContain(">0<");
  });

  it("does not round small positive ready values down to zero", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          equity: 1,
          eps: 5,
          sharesOutstanding: 10_000,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        },
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain(">0.0001<");
    expect(html).not.toContain(">0<");
  });

  it("renders not applicable states for non-positive EPS and equity", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          equity: 0,
          eps: -1,
          sharesOutstanding: 100,
          units: { equity: "vnd", eps: "vnd_per_share", sharesOutstanding: "shares" },
        },
        persistedValuationInputs: { marketPrice: 20, units: { marketPrice: "vnd_per_share" } },
      }),
    );

    expect(html).toContain("not_applicable");
    expect(html).toContain("eps non positive");
    expect(html).toContain("equity non positive");
  });

  it("renders EV, EV/EBITDA, DCF, and intrinsic value band as blocked", () => {
    const html = renderPanel();

    expect(html).toContain("EV");
    expect(html).toContain("EV/EBITDA");
    expect(html).toContain("DCF");
    expect(html).toContain("intrinsic value band");
    expect(html).toContain("blocked until explicit ev inputs");
    expect(html).toContain("blocked until ebitda source is explicit");
    expect(html).toContain("blocked no dcf wacc in phase 59");
    expect(html).toContain("blocked no intrinsic value band in phase 59");
  });

  it("does not render forbidden wording", () => {
    const html = renderPanel(
      buildControlledValuationIntegrationBoundary({
        financialsRuntimeSnapshot: {
          revenue: 1000,
          equity: 1000,
          eps: 5,
          sharesOutstanding: 100,
          dataMode: "research_only",
          readPath: "local_db",
          units: { equity: "vnd", eps: "vnd_per_share", revenue: "vnd", sharesOutstanding: "shares" },
        },
        persistedValuationInputs: { marketCap: 10_000, marketPrice: 100, units: { marketCap: "vnd", marketPrice: "vnd_per_share" } },
      }),
    ).toLowerCase();
    const blockedPhrases = [
      "nen mua",
      "tin hieu mua",
      "dinh gia hap dan",
      "dang re",
      "dang mua",
      "hap dan",
      "gia muc tieu",
      "muc tieu gia",
      "upside",
      "downside",
      "official",
      "realtime",
      "production-ready",
      "production-approved",
    ];

    for (const phrase of blockedPhrases) {
      expect(html).not.toContain(phrase);
    }
  });
});
