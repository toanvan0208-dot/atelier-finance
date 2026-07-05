import { describe, expect, it } from "vitest";

import type { MacroCompassMetric } from "../../types";
import { buildMacroPracticalReading } from "../macro-practical-reading";

function metric(overrides: Partial<MacroCompassMetric>): MacroCompassMetric {
  return {
    id: "gdp",
    name: "GDP",
    value: null,
    unit: null,
    period: "2025",
    asOf: "2025-12-31",
    sourceName: "test",
    sourceLabel: "test",
    sourceRef: null,
    dataMode: "research_only",
    productionApproved: false,
    status: "available",
    statusLabel: "Dữ liệu hệ thống",
    tone: "watch",
    simpleMeaning: "Mô tả chỉ số.",
    marketImpact: "Tác động thị trường.",
    relatedSectors: [],
    confidence: "Dữ liệu thử nghiệm.",
    whatToCheckNext: "Kiểm tra tiếp.",
    warnings: [],
    group: "growth",
    ...overrides,
  };
}

describe("macro practical reading", () => {
  it("explains GDP by current number instead of generic theory", () => {
    const reading = buildMacroPracticalReading(metric({
      id: "gdp",
      value: 7.0912,
      unit: "% YoY",
    }));

    expect(reading?.current).toContain("vùng tăng trưởng mạnh sơ bộ");
    expect(reading?.current).toContain("doanh thu doanh nghiệp");
    expect(reading?.benchmark).toContain("Trên 7%");
    expect(reading?.caveat).toContain("cấu phần tăng trưởng");
  });

  it("explains high USD/VND pressure and who is affected", () => {
    const reading = buildMacroPracticalReading(metric({
      id: "usd-vnd",
      name: "USD/VND",
      value: 26121,
      unit: "vnd_per_usd",
      group: "currency",
    }));

    expect(reading?.current).toContain("vùng áp lực tỷ giá cao");
    expect(reading?.current).toContain("nhập khẩu");
    expect(reading?.benchmark).toContain("Trên 26.000");
    expect(reading?.impact).toContain("nợ ngoại tệ");
    expect(reading?.caveat).toContain("so với tháng/quý trước");
  });

  it("keeps missing observations explicit instead of filling with theory", () => {
    const reading = buildMacroPracticalReading(metric({
      id: "pmi",
      name: "PMI",
      value: null,
      status: "missing",
      group: "growth",
    }));

    expect(reading?.current).toContain("Chưa có số liệu đủ sạch");
    expect(reading?.caveat).toContain("bổ sung quan sát mới nhất");
  });
});
