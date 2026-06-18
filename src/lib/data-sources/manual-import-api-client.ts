export type ManualImportSaveInput = {
  csvText: string;
  sourceLabel?: string;
  fileName?: string;
  targetTicker?: string;
  targetPeriod?: string;
};

export type ManualImportSaveResult = {
  sessionId: string;
  dataQualityReportId: string;
  status: "pass" | "needs_review" | "failed";
  readiness: string;
  counts: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
  };
  warningCodes: string[];
  errorCodes: string[];
  missingFields: string[];
  sourceType: "user_input";
  dataMode: "user_input";
  productionApproved: false;
};

type ManualImportApiSuccess = {
  ok: true;
  status: "success";
  data: ManualImportSaveResult;
};

type ManualImportApiError = {
  ok: false;
  status: "error";
  error: {
    code: string;
    message: string;
    reason?: string;
  };
};

type ManualImportApiBody = ManualImportApiSuccess | ManualImportApiError;

export class ManualImportSaveError extends Error {
  constructor(
    message: string,
    readonly code = "MANUAL_IMPORT_SAVE_FAILED",
  ) {
    super(message);
    this.name = "ManualImportSaveError";
  }
}

export const buildManualImportSavePayload = (input: ManualImportSaveInput) => ({
  kind: "csv" as const,
  csvText: input.csvText,
  sourceLabel: input.sourceLabel ?? "manual_upload",
  fileName: input.fileName ?? "manual-import.csv",
  targetTicker: input.targetTicker?.trim() || undefined,
  targetPeriod: input.targetPeriod?.trim() || undefined,
});

export const saveManualImportSession = async (
  input: ManualImportSaveInput,
  fetcher: typeof fetch = fetch,
): Promise<ManualImportSaveResult> => {
  const response = await fetcher("/api/manual-imports", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(buildManualImportSavePayload(input)),
  });

  let body: ManualImportApiBody | null = null;
  try {
    body = (await response.json()) as ManualImportApiBody;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.ok) {
    const apiError = body && !body.ok ? body.error : null;
    throw new ManualImportSaveError(
      apiError?.message ?? "Unable to save the manual import session.",
      apiError?.code,
    );
  }

  return body.data;
};
