import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildFinancialsUnitMetadata } from "@/features/financials/lib/financials-unit-metadata-contract";
import { buildAssistantApiPayload } from "@/lib/ai-rag/context";
import {
  buildAssistantScreenContextPacket,
  readAssistantTickerFromSearch,
} from "../assistant-screen-context";

const runtimeData: FinancialsRuntimeData = {
  runtimeStatus: "db_backed",
  source: {
    sourceLabel: "Reviewed local financial statement",
    dataMode: "research_only",
    productionApproved: false,
    fallbackUsed: false,
    readPath: "local_db",
    ticker: "FPT",
    asOf: "2026-06-22",
    fiscalYear: 2025,
    periodType: "annual",
  },
  dataQuality: {
    status: "partial",
    missingFields: ["eps", "totalDebt"],
    warnings: ["Research data only."],
    errors: [],
  },
  statementSnapshot: {
    ticker: "FPT",
    period: "2025",
    sourceName: "Reviewed local financial statement",
    revenue: 125,
    eps: null,
    totalDebt: null,
  },
  unitMetadata: buildFinancialsUnitMetadata(),
  readResult: null,
};

describe("RightAssistantPanel grounded screen context", () => {
  it("builds a packet with active module, URL ticker, source metadata and real numbers", () => {
    const ticker = readAssistantTickerFromSearch("?module=risk&ticker=fpt");
    const packet = buildAssistantScreenContextPacket({
      activeModule: "risk",
      ticker,
      financialsRuntimeData: runtimeData,
    });
    const payload = buildAssistantApiPayload("Du lieu nay dang thieu gi?", packet);

    expect(payload.activeModule).toBe("risk");
    expect(payload.ticker).toBe("FPT");
    expect(payload.contextPacket.dataQuality).toMatchObject({
      dataMode: "research_only",
      productionApproved: false,
      sourceName: "Reviewed local financial statement",
      asOf: "2026-06-22",
      period: "2025",
    });
    expect(payload.contextPacket.missingFields).toEqual(["eps", "totalDebt"]);
    expect(payload.contextPacket.dataQuality.missingFields).toEqual(["eps", "totalDebt"]);
    expect(payload.contextPacket.allowedNumericValues).toContain(125);
    expect(payload.contextPacket.moduleContext).toMatchObject({
      financials: {
        revenue: 125,
        eps: null,
        totalDebt: null,
      },
      valuation: {
        marketPrice: null,
        eps: null,
        peStatus: "insufficient_data",
      },
      risk: {
        totalDebt: null,
        totalDebtSource: null,
        leverageRiskStatus: "insufficient_data",
      },
    });
  });

  it("fails closed when module context cannot be collected safely", () => {
    const packet = buildAssistantScreenContextPacket({
      activeModule: "business",
      ticker: "FPT",
      financialsRuntimeData: runtimeData,
    });

    expect(packet.moduleContext).toBeNull();
    expect(packet.allowedNumericValues).toEqual([]);
    expect(packet.dataQuality.productionApproved).toBe(false);
    expect(packet.missingFields).toEqual(
      expect.arrayContaining(["moduleContext", "source", "asOf", "period"]),
    );
  });

  it("does not expose sample or fallback runtime values as grounded evidence", () => {
    const packet = buildAssistantScreenContextPacket({
      activeModule: "valuation",
      ticker: "FPT",
      financialsRuntimeData: {
        ...runtimeData,
        runtimeStatus: "sample_fallback",
        source: {
          ...runtimeData.source,
          dataMode: "sample",
          fallbackUsed: true,
          readPath: "sample_static",
        },
      },
    });

    expect(packet.moduleContext).toBeNull();
    expect(packet.allowedNumericValues).toEqual([]);
    expect(packet.dataQuality.productionApproved).toBe(false);
  });

  it("wires the packet builder into the assistant POST body", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/layout/RightAssistantPanel.tsx"),
      "utf8",
    );

    expect(source).toContain("buildAssistantScreenContextPacket");
    expect(source).toContain("readAssistantTickerFromSearch(window.location.search)");
    expect(source).toContain("JSON.stringify(buildAssistantApiPayload(trimmed, contextPacket))");
  });
});
