import type {
  AdapterError,
  AdapterResult,
  AdapterWarning,
  SourceAdapter,
  SourceEvidence,
  SourceEvidenceEvaluation,
  SourceRegistryEntry,
  SourceUsageMode,
  SourceUsageStatus,
} from "./types";

const privateAccessMethods = new Set([
  "private_api",
  "undocumented_api",
  "private_or_undocumented_api",
]);

const scrapedAccessMethods = new Set(["scraping", "scraped"]);

const warning = (code: string, message: string, field?: string): AdapterWarning => ({
  code,
  message,
  field,
});

const error = (code: string, message: string, field?: string): AdapterError => ({
  code,
  message,
  field,
});

const hasLicenseAndTerms = (evidence: SourceEvidence): boolean =>
  Boolean(evidence.licenseName && evidence.licenseUrl && evidence.termsUrl);

const hasRuntimeRights = (evidence: SourceEvidence): boolean =>
  evidence.allowsCommercialUse === true &&
  evidence.allowsRuntimeDisplay === true &&
  evidence.allowsCaching === true &&
  evidence.allowsDerivedData === true;

const hasAttributionIfRequired = (evidence: SourceEvidence): boolean =>
  evidence.requiresAttribution !== true || Boolean(evidence.attributionText);

const normalizeStatusFromEvidence = (
  evidence: SourceEvidence,
  requestedStatus: SourceUsageStatus,
): SourceUsageStatus => {
  if (requestedStatus === "blocked" || evidence.blockedReason) return "blocked";
  if (privateAccessMethods.has(evidence.accessMethod)) return "blocked";
  if (scrapedAccessMethods.has(evidence.accessMethod) && requestedStatus === "approved") {
    return "needs_legal_review";
  }
  if (requestedStatus === "approved" && evidence.evidenceStatus !== "verified") {
    return "needs_legal_review";
  }
  if (requestedStatus === "approved" && (!hasLicenseAndTerms(evidence) || !hasRuntimeRights(evidence))) {
    return "needs_legal_review";
  }
  return requestedStatus;
};

export const canCacheSourceData = (evidence: SourceEvidence): boolean =>
  evidence.allowsCaching === true;

export const canRedistributeSourceData = (evidence: SourceEvidence): boolean =>
  evidence.allowsRedistribution === true;

export const requireLegalReview = (
  evidence: SourceEvidence,
  sourceStatus: SourceUsageStatus,
): boolean => {
  if (sourceStatus === "blocked" || evidence.blockedReason) return false;
  if (sourceStatus === "needs_legal_review" || sourceStatus === "unknown") return true;
  if (evidence.evidenceStatus !== "verified") return true;
  if (!hasLicenseAndTerms(evidence)) return true;
  if (scrapedAccessMethods.has(evidence.accessMethod)) return true;
  return !hasRuntimeRights(evidence) || !hasAttributionIfRequired(evidence);
};

export const evaluateSourceEvidence = (
  evidence: SourceEvidence,
  requestedStatus: SourceUsageStatus = "unknown",
): SourceEvidenceEvaluation => {
  const sourceStatus = normalizeStatusFromEvidence(evidence, requestedStatus);
  const warnings: AdapterWarning[] = [];
  const errors: AdapterError[] = [];

  if (evidence.evidenceStatus !== "verified") {
    warnings.push(warning("SOURCE_EVIDENCE_NOT_VERIFIED", "Source evidence is not verified.", "evidenceStatus"));
  }

  if (!hasLicenseAndTerms(evidence)) {
    warnings.push(warning("LICENSE_OR_TERMS_MISSING", "License name, license URL, and terms URL are required.", "licenseUrl"));
  }

  if (privateAccessMethods.has(evidence.accessMethod)) {
    errors.push(error("PRIVATE_SOURCE_BLOCKED", "Private or undocumented access is blocked by default.", "accessMethod"));
  }

  if (scrapedAccessMethods.has(evidence.accessMethod)) {
    warnings.push(warning("SCRAPED_SOURCE_NEEDS_REVIEW", "Scraped sources require legal review before use.", "accessMethod"));
  }

  if (!canCacheSourceData(evidence)) {
    warnings.push(warning("CACHE_NOT_ALLOWED", "Source data cannot be cached unless caching permission is explicitly true.", "allowsCaching"));
  }

  if (!canRedistributeSourceData(evidence)) {
    warnings.push(warning("REDISTRIBUTION_NOT_ALLOWED", "Source data cannot be redistributed unless permission is explicitly true.", "allowsRedistribution"));
  }

  if (evidence.allowsRuntimeDisplay !== true) {
    warnings.push(warning("RUNTIME_DISPLAY_NOT_ALLOWED", "Source data cannot be displayed in product runtime unless permission is explicitly true.", "allowsRuntimeDisplay"));
  }

  if (evidence.requiresAttribution === true && !evidence.attributionText) {
    warnings.push(warning("ATTRIBUTION_TEXT_MISSING", "Attribution text is required but missing.", "attributionText"));
  }

  if (sourceStatus === "blocked") {
    errors.push(error("SOURCE_BLOCKED", evidence.blockedReason ?? "Source is blocked by policy."));
  }

  const productionUsable =
    sourceStatus === "approved" &&
    evidence.evidenceStatus === "verified" &&
    hasLicenseAndTerms(evidence) &&
    hasRuntimeRights(evidence) &&
    hasAttributionIfRequired(evidence);

  const allowedModes: SourceUsageMode[] = [];
  if (sourceStatus !== "blocked") {
    if (sourceStatus === "approved" || sourceStatus === "research_only") {
      allowedModes.push("development");
    }
    if (evidence.allowsAcademicUse === true && (sourceStatus === "approved" || sourceStatus === "research_only")) {
      allowedModes.push("thesis_verification");
    }
    if (productionUsable) {
      allowedModes.push("production");
    }
    if (evidence.sourceId.includes("mock") || evidence.accessMethod === "manual_fixture") {
      allowedModes.push("test");
    }
  }

  return {
    sourceId: evidence.sourceId,
    sourceStatus,
    productionUsable,
    allowedModes,
    canCache: canCacheSourceData(evidence),
    canRedistribute: canRedistributeSourceData(evidence),
    requiresLegalReview: requireLegalReview(evidence, sourceStatus),
    warnings,
    errors,
  };
};

export const canUseSourceForRuntime = (
  evidence: SourceEvidence,
  mode: SourceUsageMode,
  requestedStatus: SourceUsageStatus = "unknown",
): boolean => evaluateSourceEvidence(evidence, requestedStatus).allowedModes.includes(mode);

export const blockedAdapterResult = <T>(
  sourceId: string,
  errors: AdapterError[],
  warnings: AdapterWarning[] = [],
): AdapterResult<T> => ({
  data: null,
  metadata: null,
  warnings,
  errors: errors.length > 0 ? errors : [error("SOURCE_NOT_ALLOWED", `Source ${sourceId} is not allowed.`)],
  readiness: "not_ready",
});

export const assertSourceAllowedForAdapter = <T>(
  adapter: SourceAdapter,
  registryEntry: SourceRegistryEntry,
  mode: SourceUsageMode,
): AdapterResult<T> | null => {
  if (!registryEntry.sourceEvidence) {
    return blockedAdapterResult<T>(adapter.id, [
      error("SOURCE_EVIDENCE_MISSING", "Adapter source has no evidence record.", "sourceEvidence"),
    ]);
  }

  const evaluation = evaluateSourceEvidence(registryEntry.sourceEvidence, registryEntry.usageStatus);
  if (!evaluation.allowedModes.includes(mode)) {
    return blockedAdapterResult<T>(
      adapter.id,
      [
        ...evaluation.errors,
        error("SOURCE_MODE_NOT_ALLOWED", `Source is not allowed in ${mode} mode.`, "mode"),
      ],
      evaluation.warnings,
    );
  }

  return null;
};
