import type { RetrievalDocument, RetrievalSafetyLevel } from "../retrieval";
import type { RagDocumentChunk, RagSectionType } from "./types";

type Heading = {
  level: number;
  title: string;
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase();

const slug = (value: string): string =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

const detectSectionType = (sectionPath: string[], text: string): RagSectionType => {
  const normalized = normalizeText([...sectionPath, text.slice(0, 200)].join(" "));

  if (/\b(test case|test cases|release checklist|expected safe response)\b/i.test(normalized)) return "test_case";
  if (/\b(forbidden outputs|forbidden usage|unsafe examples|vi du sai|negative example)\b/i.test(normalized)) return "forbidden_example";
  if (/\b(purpose|muc dich)\b/i.test(normalized)) return "purpose";
  if (/\b(core principle|nguyen tac cot loi)\b/i.test(normalized)) return "core_principle";
  if (/\b(missing data|du lieu thieu|null|not_available|insufficient_data)\b/i.test(normalized)) return "missing_data";
  if (/\b(boundar|must not|khong duoc|khong nen|limitation|gioi han)\b/i.test(normalized)) return "interpretation_boundary";
  if (/\b(template|mau phan hoi an toan|safe response|safe version)\b/i.test(normalized)) return "safe_template";
  if (/\b(concept|definition|dinh nghia|explain|giai thich)\b/i.test(normalized)) return "concept";
  if (/\b(reference|related documents|quan he)\b/i.test(normalized)) return "reference";

  return "unknown";
};

const detectFlags = (sectionPath: string[], text: string) => {
  const normalized = normalizeText([...sectionPath, text].join(" "));
  const isNegativeExample = /\b(negative example|vi du sai|do not use|copy.*negative)\b/i.test(normalized);
  const isForbiddenExample = /\b(forbidden outputs|forbidden usage|unsafe examples|khong duoc noi|cau tra loi sai)\b/i.test(normalized);
  const isTestCase = /\b(test case|test cases|expected refusal|expected safe response|release checklist)\b/i.test(normalized);

  return {
    isForbiddenExample,
    isNegativeExample,
    isTestCase,
  };
};

const currentSectionPath = (headings: Heading[]): string[] =>
  headings.map((heading) => heading.title);

const buildChunk = (
  document: RetrievalDocument,
  title: string,
  sectionPath: string[],
  text: string,
  index: number,
  safetyLevel?: RetrievalSafetyLevel,
): RagDocumentChunk | null => {
  const trimmedText = text.trim();

  if (!trimmedText) return null;

  const flags = detectFlags(sectionPath, trimmedText);
  const sectionType = detectSectionType(sectionPath, trimmedText);
  const chunkId = `${document.id}:${String(index).padStart(3, "0")}:${slug(sectionPath.at(-1) ?? title)}`;

  return {
    chunkId,
    documentId: document.id,
    filePath: document.filePath,
    title,
    sectionPath,
    text: trimmedText,
    charLength: trimmedText.length,
    tokenEstimate: Math.ceil(trimmedText.length / 4),
    sectionType,
    isMaintainerOnly: document.audience === "maintainer",
    safetyLevel,
    score: 0,
    ...flags,
  };
};

export const chunkMarkdownDocument = (
  document: RetrievalDocument,
  content: string,
  safetyLevel?: RetrievalSafetyLevel,
): RagDocumentChunk[] => {
  const lines = content.split(/\r?\n/);
  const headingStack: Heading[] = [];
  const chunks: RagDocumentChunk[] = [];
  let documentTitle = document.title;
  let currentText: string[] = [];
  let chunkIndex = 0;

  const flush = (): void => {
    const sectionPath = currentSectionPath(headingStack);
    const chunk = buildChunk(
      document,
      documentTitle,
      sectionPath.length > 0 ? sectionPath : [documentTitle],
      currentText.join("\n"),
      chunkIndex,
      safetyLevel,
    );

    if (chunk) {
      chunks.push(chunk);
      chunkIndex += 1;
    }

    currentText = [];
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);

    if (headingMatch) {
      flush();

      const level = headingMatch[1].length;
      const headingTitle = headingMatch[2].trim();

      if (level === 1 && chunks.length === 0 && currentText.length === 0) {
        documentTitle = headingTitle;
      }

      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }

      headingStack.push({ level, title: headingTitle });
      currentText.push(line);
    } else {
      currentText.push(line);
    }
  }

  flush();

  return chunks;
};
