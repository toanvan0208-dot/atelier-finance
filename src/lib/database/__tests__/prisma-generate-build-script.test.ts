import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Prisma generated client build setup", () => {
  it("generates the ignored Prisma client before production build", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.prebuild).toBe("prisma generate");
    expect(packageJson.scripts?.build).toBe("next build");
  });
});
