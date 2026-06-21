/**
 * Local import access guard / runtime kill switch.
 *
 * Controls whether the local CSV import UI and API route are enabled.
 * Fail-closed by default: missing env, empty, or any value other than
 * the exact string "true" keeps local imports disabled.
 *
 * This is NOT production auth — it is a lightweight runtime kill switch
 * to prevent accidental DB writes when the import feature should be off.
 *
 * Env variable: ATELIER_LOCAL_IMPORTS_ENABLED
 *   "true"  → enabled
 *   missing / "" / "false" / "0" / "yes" / "TRUE" / anything else → disabled
 */

/**
 * Returns true only when local imports are explicitly enabled via env.
 * Safe to call on both server and during SSR — reads process.env directly.
 */
export const isLocalImportsEnabled = (): boolean => {
  const value = process.env.ATELIER_LOCAL_IMPORTS_ENABLED;
  return value === "true";
};
