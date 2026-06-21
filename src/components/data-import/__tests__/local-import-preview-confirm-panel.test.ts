import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canConfirmLocalImport, type LocalImportUiResult } from "../LocalImportPreviewConfirmPanel";

const root = process.cwd();
const componentPath = join(root, "src/components/data-import/LocalImportPreviewConfirmPanel.tsx");

const dryRunPreview = (overrides: Partial<LocalImportUiResult> = {}): LocalImportUiResult => ({
  status: "dry_run_completed",
  productionApproved: false,
  audit: {
    totalRows: 2,
    validRows: 1,
    invalidRows: 0,
    writtenRows: 0,
    skippedRows: 1,
    duplicateSkippedRows: 0,
    productionApproved: false,
    warnings: [],
    errors: [],
  },
  ...overrides,
});

describe("LocalImportPreviewConfirmPanel", () => {
  it("keeps confirm disabled until a successful dry-run preview exists", () => {
    expect(canConfirmLocalImport(null)).toBe(false);
    expect(canConfirmLocalImport(dryRunPreview())).toBe(true);
    expect(
      canConfirmLocalImport(
        dryRunPreview({
          audit: {
            errors: [],
            productionApproved: false,
            status: "dry_run_completed",
            validRows: 1,
          },
          status: undefined,
        }),
      ),
    ).toBe(true);
    expect(canConfirmLocalImport(dryRunPreview({ status: "preview_ready" }))).toBe(true);
    expect(canConfirmLocalImport(dryRunPreview({ status: "completed" }))).toBe(false);
    expect(canConfirmLocalImport(dryRunPreview({ audit: { validRows: 0, errors: [], productionApproved: false } }))).toBe(false);
    expect(canConfirmLocalImport(dryRunPreview({ audit: { validRows: 1, errors: ["bad unit"], productionApproved: false } }))).toBe(false);
    expect(canConfirmLocalImport(dryRunPreview({ productionApproved: true }))).toBe(false);
  });

  it("renders the local-only preview and confirm flow copy", () => {
    const content = readFileSync(componentPath, "utf8");

    expect(content).toContain("Financial Statement");
    expect(content).toContain("Market/PVT");
    expect(content).toContain("textarea");
    expect(content).toContain("Run dry-run preview");
    expect(content).toContain("Confirm write");
    expect(content).toContain("productionApproved:false");
    expect(content).toContain("local/imported");
    expect(content).toContain("/api/local-imports/preview-confirm");
    expect(content).toContain("x-atelier-local-import");
  });

  it("does not add advisory or approved-source claims", () => {
    const content = readFileSync(componentPath, "utf8").toLowerCase();

    for (const phrase of ["production-ready", "target price", "fair value", "buy signal", "sell signal"]) {
      expect(content).not.toContain(phrase);
    }
  });
});
