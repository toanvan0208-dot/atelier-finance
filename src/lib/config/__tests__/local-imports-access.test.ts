import { afterEach, describe, expect, it } from "vitest";
import { isLocalImportsEnabled } from "../local-imports-access";

const ENV_KEY = "ATELIER_LOCAL_IMPORTS_ENABLED";

describe("isLocalImportsEnabled", () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it("returns false when env var is missing (fail-closed default)", () => {
    delete process.env[ENV_KEY];
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns true only when env var is exactly "true"', () => {
    process.env[ENV_KEY] = "true";
    expect(isLocalImportsEnabled()).toBe(true);
  });

  it('returns false for "false"', () => {
    process.env[ENV_KEY] = "false";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns false for "0"', () => {
    process.env[ENV_KEY] = "0";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns false for "yes"', () => {
    process.env[ENV_KEY] = "yes";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns false for "TRUE" (case-sensitive)', () => {
    process.env[ENV_KEY] = "TRUE";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it("returns false for empty string", () => {
    process.env[ENV_KEY] = "";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns false for "1"', () => {
    process.env[ENV_KEY] = "1";
    expect(isLocalImportsEnabled()).toBe(false);
  });

  it('returns false for "True" (mixed case)', () => {
    process.env[ENV_KEY] = "True";
    expect(isLocalImportsEnabled()).toBe(false);
  });
});
