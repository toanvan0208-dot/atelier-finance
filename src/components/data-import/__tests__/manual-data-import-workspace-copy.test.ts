import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const files = [
  join(root, "src/components/data-import/ManualDataImportWorkspace.tsx"),
  join(root, "src/features/overview/components/OverviewPage.tsx"),
  join(root, "docs/product/MANUAL_DATA_IMPORT_WORKSPACE.md"),
  join(root, "docs/product/MANUAL_IMPORT_UX_HARDENING.md"),
  join(root, "docs/product/MANUAL_IMPORT_PRODUCT_INTEGRATION.md"),
];

const forbiddenPhrases = [
  "nên mua",
  "nên bán",
  "nên nắm giữ",
  "tín hiệu mua",
  "tín hiệu bán",
  "điểm mua",
  "điểm bán",
  "cổ phiếu an toàn",
  "chắc chắn rẻ",
  "chắc chắn xấu",
  "target price",
  "fair value",
];

describe("Manual data import workspace copy", () => {
  it("keeps Phase 28D UI and docs free of forbidden advisory wording", () => {
    const content = files.map((file) => readFileSync(file, "utf8")).join("\n").toLowerCase();

    for (const phrase of forbiddenPhrases) {
      expect(content).not.toContain(phrase);
    }
  });

  it("documents a visible product entry for manual import", () => {
    const overview = readFileSync(join(root, "src/features/overview/components/OverviewPage.tsx"), "utf8");

    expect(overview).toContain("Nhập dữ liệu");
    expect(overview).toContain("/data-import");
    expect(overview).toContain("Dữ liệu này do người dùng cung cấp");
    expect(overview).toContain("không phải nguồn dữ liệu hệ thống đã xác minh");
  });
});
