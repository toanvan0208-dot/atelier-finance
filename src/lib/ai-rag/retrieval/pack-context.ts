import type { PackedRetrievalContext, SelectRagDocumentsResult } from "./types";

export const packRetrievalContext = (
  selection: SelectRagDocumentsResult,
): PackedRetrievalContext => {
  const lines = [
    `Intent: ${selection.intent}`,
    `Active module: ${selection.activeModule ?? "unknown"}`,
    `Safety level: ${selection.safetyLevel}`,
    "",
    "Selected documents:",
    ...selection.selectedDocuments.map(
      (document) =>
        `- ${document.id} | ${document.filePath} | audience=${document.audience} | purpose=${document.purpose}`,
    ),
    "",
    "Excluded documents:",
    ...(selection.excludedDocuments.length > 0
      ? selection.excludedDocuments.map((document) => `- ${document.id} | ${document.filePath}`)
      : ["- none"]),
    "",
    "Reasons:",
    ...selection.reasons.map((reason) => `- ${reason}`),
    "",
    "Warnings:",
    ...(selection.warnings.length > 0 ? selection.warnings.map((warning) => `- ${warning}`) : ["- none"]),
  ];

  return {
    contextText: lines.join("\n"),
    selectedDocumentIds: selection.selectedDocuments.map((document) => document.id),
    warnings: selection.warnings,
  };
};
