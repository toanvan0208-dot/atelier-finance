import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { LoadedMarkdownDocument } from "./types";
import type { RetrievalDocument } from "../retrieval";

const normalizeRepoPath = (filePath: string): string => filePath.replace(/\\/g, "/");

const isAllowedDocumentPath = (filePath: string): boolean => {
  const normalized = normalizeRepoPath(filePath);

  return normalized.startsWith("docs/rag/") || normalized.startsWith("docs/ai/");
};

export const loadMarkdownDocument = (
  document: RetrievalDocument,
  cwd = process.cwd(),
): LoadedMarkdownDocument => {
  if (!isAllowedDocumentPath(document.filePath)) {
    return {
      document,
      content: null,
      warnings: [`Document path is not allowed for RAG ingestion: ${document.filePath}`],
    };
  }

  const absolutePath = path.resolve(cwd, document.filePath);

  if (!existsSync(absolutePath)) {
    return {
      document,
      content: null,
      warnings: [`Markdown document not found: ${document.filePath}`],
    };
  }

  try {
    return {
      document,
      content: readFileSync(absolutePath, "utf8"),
      warnings: [],
    };
  } catch (error) {
    return {
      document,
      content: null,
      warnings: [
        `Failed to read Markdown document ${document.filePath}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      ],
    };
  }
};
