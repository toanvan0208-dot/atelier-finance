import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  buildVcbIdentityEvidence,
  buildVcbPreview,
  evaluateVcbIdentity,
} from "../annual-report-2025-vcb-manual-preview";

describe("Phase 139M VCB bank-specific annual report preview", () => {
  it("accepts VCB consolidated audited identity", () => {
    expect(buildVcbIdentityEvidence().status).toBe("valid_vcb_consolidated");
    expect(
      evaluateVcbIdentity({
        companyName: "Ngân hàng TMCP Ngoại thương Việt Nam",
        ticker: "VCB",
        reportTitle: "Báo cáo Thường niên 2025",
        consolidatedTitle: "Báo cáo tài chính hợp nhất",
        auditor: "KPMG",
      }),
    ).toMatchObject({
      status: "valid_vcb_consolidated",
      annualReportStatus: "confirmed",
      auditStatus: "audited",
      consolidatedScopeStatus: "consolidated"
    });
  });

  it("requires null for EPS and Shares if not explicitly previewed", () => {
    const previews = buildVcbPreview();
    const eps = previews.find((field) => field.field === "eps");
    const shares = previews.find((field) => field.field === "sharesOutstanding");
    
    expect(eps?.value).toBeNull();
    expect(eps?.status).toBe("needs_review");
    
    expect(shares?.value).toBeNull();
    expect(shares?.status).toBe("needs_review");
  });

  it("enforces null totalDebt and specific mapping status for banks", () => {
    const previews = buildVcbPreview();
    const debt = previews.find((field) => field.field === "totalDebt");
    
    expect(debt?.value).toBeNull();
    expect(debt?.status).toBe("missing");
    expect(debt?.debtMappingStatus).toBe("needs_bank_mapping");
  });

  it("keeps productionApproved false", () => {
    const previews = buildVcbPreview();
    expect(previews.every((field) => field.productionApproved === false)).toBe(
      true,
    );
  });

  it("contains no write, import execution, confirm-write, or Prisma client in script", () => {
    const script = fs.readFileSync(
      path.join(process.cwd(), "scripts/dry-run-vcb-bank-annual-report-preview.ts"),
      "utf8",
    );
    expect(script).not.toContain("prisma.");
    expect(script).not.toContain("createMany");
    expect(script).not.toContain("upsert");
    expect(script).not.toContain("confirm-write");
    expect(script).not.toContain("DATABASE_URL");
  });
});
