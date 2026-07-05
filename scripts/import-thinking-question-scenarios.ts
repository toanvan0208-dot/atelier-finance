import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_CSV_PATH =
  "D:\\AtelierFinanceThinkingReview\\normalized\\thinking_scope3_dynamic_question_scenarios_candidate.csv";
const SOURCE_ID = "thinking-review-candidate-source";
const SOURCE_LABEL = "AtelierFinanceThinkingReview dynamic question scenarios";

const loadEnv = () => {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator);
    const rawValue = trimmed.slice(separator + 1);
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^"|"$/g, "");
    }
  }
};

const parseCsv = (content: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index]?.trim() ?? ""])),
  );
};

const splitList = (value: string, separator: string | RegExp = /;|,/): string[] =>
  value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

const parseOptions = (value: string): Array<{ key: string; label: string }> =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = /^([A-Z])\)\s*(.+)$/.exec(item);
      return match ? { key: match[1], label: match[2] } : { key: "", label: item };
    });

const answerKeyCycle = ["A", "B", "C"];

const rebalanceCorrectAnswer = (
  options: Array<{ key: string; label: string }>,
  originalCorrectAnswer: string,
  rowIndex: number,
): { options: Array<{ key: string; label: string }>; correctAnswer: string } => {
  const targetCorrectAnswer = answerKeyCycle[rowIndex % answerKeyCycle.length];
  const correctOption = options.find((option) => option.key === originalCorrectAnswer);
  if (!correctOption || targetCorrectAnswer === originalCorrectAnswer) {
    return { options, correctAnswer: originalCorrectAnswer };
  }

  const remainingOptions = options.filter((option) => option.key !== originalCorrectAnswer);
  const remappedOptions = answerKeyCycle.map((key) => {
    if (key === targetCorrectAnswer) return { key, label: correctOption.label };
    const nextOption = remainingOptions.shift();
    return { key, label: nextOption?.label ?? "" };
  });

  return {
    correctAnswer: targetCorrectAnswer,
    options: remappedOptions.filter((option) => option.label),
  };
};

const boolFromCsv = (value: string): boolean => value.trim().toLowerCase() === "true";

const requiredFields = [
  "scenario_id",
  "ticker",
  "industry_code",
  "module_context",
  "source_modules",
  "trigger_signal",
  "question_type",
  "question_text",
  "options",
  "correct_answer",
  "explanation",
  "evidence_fields",
  "evidence_status",
  "data_quality_status",
  "missing_data_behavior",
  "guardrail_note",
  "difficulty",
  "review_status",
  "needs_review",
  "production_approved",
  "notes",
];

async function main() {
  loadEnv();
  const csvPath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_CSV_PATH;
  if (!existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const { prisma } = await import("../src/lib/database/client");
  const { PermissionFlag, SourceAccessMethod, SourceType, SourceUsageStatus, LegalReviewStatus } =
    await import("../src/generated/prisma/client");

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const missingFieldRows = rows.filter((row) => requiredFields.some((field) => !row[field]));
  if (missingFieldRows.length > 0) {
    throw new Error(`CSV has ${missingFieldRows.length} row(s) with missing required fields.`);
  }

  await prisma.dataSource.upsert({
    where: {
      name_sourceType: {
        name: SOURCE_LABEL,
        sourceType: SourceType.curated_internal,
      },
    },
    create: {
      id: SOURCE_ID,
      accessMethod: SourceAccessMethod.manual_fixture,
      cachingAllowed: PermissionFlag.false,
      derivedDataAllowed: PermissionFlag.true,
      name: SOURCE_LABEL,
      notes:
        "Reviewed-candidate thinking question scenarios imported from D:\\AtelierFinanceThinkingReview. Not production-approved.",
      redistributionAllowed: PermissionFlag.false,
      runtimeDisplayAllowed: PermissionFlag.true,
      sourceType: SourceType.curated_internal,
      supportedDataGroups: JSON.stringify(["thinking_question_scenarios", "checklist"]),
      tosStatus: LegalReviewStatus.not_checked,
      usageStatus: SourceUsageStatus.research_only,
      licenseStatus: LegalReviewStatus.not_checked,
    },
    update: {
      accessMethod: SourceAccessMethod.manual_fixture,
      notes:
        "Reviewed-candidate thinking question scenarios imported from D:\\AtelierFinanceThinkingReview. Not production-approved.",
      runtimeDisplayAllowed: PermissionFlag.true,
      supportedDataGroups: JSON.stringify(["thinking_question_scenarios", "checklist"]),
      usageStatus: SourceUsageStatus.research_only,
    },
  });

  await prisma.sourceEvidence.upsert({
    where: { id: "thinking-review-candidate-source-evidence" },
    create: {
      id: "thinking-review-candidate-source-evidence",
      allowsAcademicUse: PermissionFlag.true,
      allowsCaching: PermissionFlag.false,
      allowsCommercialUse: PermissionFlag.false,
      allowsDerivedData: PermissionFlag.true,
      allowsPersonalUse: PermissionFlag.true,
      allowsRedistribution: PermissionFlag.false,
      allowsRuntimeDisplay: PermissionFlag.true,
      evidenceStatus: "partially_verified",
      notes: "Local candidate workspace supplied by thesis project owner; use for review/demo only.",
      requiresAttribution: PermissionFlag.false,
      risks: JSON.stringify(["candidate_data", "not_production_approved", "needs_review"]),
      sourceId: SOURCE_ID,
    },
    update: {
      allowsRuntimeDisplay: PermissionFlag.true,
      evidenceStatus: "partially_verified",
      notes: "Local candidate workspace supplied by thesis project owner; use for review/demo only.",
      risks: JSON.stringify(["candidate_data", "not_production_approved", "needs_review"]),
    },
  });

  let upserted = 0;
  const tickerQuestionCounts = new Map<string, number>();
  for (const row of rows) {
    const needsReview = boolFromCsv(row.needs_review);
    const productionApproved = boolFromCsv(row.production_approved);
    if (!needsReview || productionApproved) {
      throw new Error(`Guardrail violation in ${row.scenario_id}: expected needs_review=true and production_approved=false.`);
    }
    const ticker = row.ticker.toUpperCase();
    const tickerQuestionIndex = tickerQuestionCounts.get(ticker) ?? 0;
    tickerQuestionCounts.set(ticker, tickerQuestionIndex + 1);
    const answerSet = rebalanceCorrectAnswer(parseOptions(row.options), row.correct_answer, tickerQuestionIndex);

    await prisma.thinkingQuestionScenario.upsert({
      where: { scenarioId: row.scenario_id },
      create: {
        dataQualityStatus: row.data_quality_status,
        difficulty: row.difficulty,
        evidenceFields: JSON.stringify(splitList(row.evidence_fields)),
        evidenceStatus: row.evidence_status,
        explanation: row.explanation,
        guardrailNote: row.guardrail_note,
        industryCode: row.industry_code,
        missingDataBehavior: row.missing_data_behavior,
        moduleContext: row.module_context,
        needsReview,
        notes: row.notes || null,
        options: JSON.stringify(answerSet.options),
        productionApproved,
        questionText: row.question_text,
        questionType: row.question_type,
        correctAnswer: answerSet.correctAnswer,
        reviewStatus: row.review_status,
        scenarioId: row.scenario_id,
        sourceId: SOURCE_ID,
        sourceLabel: SOURCE_LABEL,
        sourceModules: JSON.stringify(splitList(row.source_modules)),
        ticker,
        triggerSignal: row.trigger_signal,
      },
      update: {
        dataQualityStatus: row.data_quality_status,
        difficulty: row.difficulty,
        evidenceFields: JSON.stringify(splitList(row.evidence_fields)),
        evidenceStatus: row.evidence_status,
        explanation: row.explanation,
        guardrailNote: row.guardrail_note,
        industryCode: row.industry_code,
        missingDataBehavior: row.missing_data_behavior,
        moduleContext: row.module_context,
        needsReview,
        notes: row.notes || null,
        options: JSON.stringify(answerSet.options),
        productionApproved,
        questionText: row.question_text,
        questionType: row.question_type,
        correctAnswer: answerSet.correctAnswer,
        reviewStatus: row.review_status,
        sourceId: SOURCE_ID,
        sourceLabel: SOURCE_LABEL,
        sourceModules: JSON.stringify(splitList(row.source_modules)),
        ticker,
        triggerSignal: row.trigger_signal,
      },
    });
    upserted += 1;
  }

  console.log(JSON.stringify({ csvPath, sourceLabel: SOURCE_LABEL, upserted }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
