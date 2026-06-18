import {
  DataMode,
  ManualImportStatus,
  ReadinessStatus,
  SourceType,
} from "../../../generated/prisma/client";
import { prisma, type DatabaseClient } from "../client";

export type CreateManualImportSessionInput = {
  userId?: string | null;
  sourceLabel?: string;
  targetTicker?: string | null;
  targetPeriod?: string | null;
  fileName?: string | null;
  rowCount?: number;
};

export type CreateManualImportSessionOptions = {
  db?: DatabaseClient;
};

export const createManualImportSession = (
  input: CreateManualImportSessionInput,
  { db = prisma }: CreateManualImportSessionOptions = {},
) =>
  db.manualImportSession.create({
    data: {
      userId: input.userId ?? null,
      mode: "thesis_verification",
      sourceLabel: input.sourceLabel ?? "manual_upload",
      sourceType: SourceType.user_input,
      dataMode: DataMode.user_input,
      targetTicker: input.targetTicker?.trim().toUpperCase() || null,
      targetPeriod: input.targetPeriod?.trim() || null,
      fileName: input.fileName ?? null,
      rowCount: input.rowCount ?? 0,
      validRowCount: 0,
      warningRowCount: 0,
      errorRowCount: 0,
      status: ManualImportStatus.draft,
      readiness: ReadinessStatus.unknown,
    },
  });
