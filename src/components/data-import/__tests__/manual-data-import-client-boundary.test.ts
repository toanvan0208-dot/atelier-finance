import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("manual data import client boundary", () => {
  it("does not import the server-side data-sources barrel or database modules", () => {
    const workspace = readFileSync(
      join(root, "src/components/data-import/ManualDataImportWorkspace.tsx"),
      "utf8",
    );

    expect(workspace).not.toContain("@/lib/data-sources\"");
    expect(workspace).not.toContain("@/lib/data-sources'");
    expect(workspace).not.toContain("@/lib/database");
    expect(workspace).not.toContain("better-sqlite3");
    expect(workspace).not.toContain("@prisma");
  });
});
