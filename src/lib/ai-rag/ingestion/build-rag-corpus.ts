import { chunkMarkdownDocument } from "./chunk-markdown-document";
import { loadMarkdownDocument } from "./markdown-loader";
import type { BuildRagCorpusInput, RagCorpus } from "./types";

export const buildRagCorpus = (input: BuildRagCorpusInput): RagCorpus => {
  const warnings: string[] = [];
  const chunks = input.documents.flatMap((document) => {
    const loaded = loadMarkdownDocument(document);
    warnings.push(...loaded.warnings);

    if (!loaded.content) return [];

    return chunkMarkdownDocument(document, loaded.content, input.safetyLevel);
  });

  return {
    chunks,
    warnings,
    debug: {
      documentCount: input.documents.length,
      loadedDocumentCount: input.documents.length - warnings.length,
      chunkCount: chunks.length,
    },
  };
};
