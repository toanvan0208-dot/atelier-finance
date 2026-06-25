"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";

type LocalImportType = "financial_statement" | "market_pvt";
type LocalImportAction = "preview" | "confirm";

type LocalImportAudit = {
  status?: string;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  writtenRows?: number;
  skippedRows?: number;
  duplicateSkippedRows?: number;
  warnings?: string[];
  errors?: string[];
  productionApproved?: boolean;
};

export type LocalImportUiResult = {
  status?: string;
  productionApproved?: boolean;
  audit?: LocalImportAudit;
  summary?: LocalImportAudit;
};

const importTypeLabels: Record<LocalImportType, string> = {
  financial_statement: "Financial Statement",
  market_pvt: "Market/PVT",
};

const localImportTemplates: Record<LocalImportType, string> = {
  financial_statement: [
    "ticker,period,periodType,statementType,field,value,unit,currency,sourceLabel,sourceOwner,sourceUrl,sourceDocumentRef,asOf,dataMode,productionApproved,evidenceNote,basis",
    "FPT,2024,annual,income_statement,revenue,60000,billion_vnd,VND,phase98_local_research_csv,manual local review,,local-reviewed-csv,2026-06-21,research_only,false,Local research CSV; not official and not approved for production use,consolidated",
  ].join("\n"),
  market_pvt: [
    "ticker,tradingDate,closePrice,volume,tradingValue,currency,priceUnit,volumeUnit,tradingValueUnit,source,asOf",
    "FPT,2025-01-31,95000,1200000,114000000000,VND,VND,shares,VND,local_csv,2025-01-31",
  ].join("\n"),
};

const getAudit = (result: LocalImportUiResult | null): LocalImportAudit | undefined =>
  result?.audit ?? result?.summary;

export const canConfirmLocalImport = (preview: LocalImportUiResult | null): boolean => {
  const audit = getAudit(preview);
  const status = preview?.status ?? (typeof audit?.status === "string" ? audit.status : undefined);
  const hasCompletedPreview = status === "dry_run_completed" || status === "preview_ready";
  return Boolean(
    hasCompletedPreview &&
      audit &&
      (audit.validRows ?? 0) > 0 &&
      (audit.errors?.length ?? 0) === 0 &&
      preview?.productionApproved !== true &&
      audit.productionApproved !== true
  );
};

const readCount = (audit: LocalImportAudit | undefined, key: keyof LocalImportAudit): number => {
  const value = audit?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const messageList = (audit: LocalImportAudit | undefined, key: "warnings" | "errors"): string[] => {
  const value = audit?.[key];
  return Array.isArray(value) ? value : [];
};

export function LocalImportPreviewConfirmPanel({ enabled = false }: { enabled?: boolean }) {
  const [importType, setImportType] = useState<LocalImportType>("financial_statement");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<LocalImportUiResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<LocalImportUiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<LocalImportAction | null>(null);

  const previewAudit = useMemo(() => getAudit(preview), [preview]);
  const confirmAudit = useMemo(() => getAudit(confirmResult), [confirmResult]);
  const canConfirm = canConfirmLocalImport(preview);

  const resetResult = () => {
    setPreview(null);
    setConfirmResult(null);
    setError(null);
  };

  const runImportAction = async (action: LocalImportAction) => {
    setPendingAction(action);
    setError(null);
    if (action === "preview") {
      setPreview(null);
      setConfirmResult(null);
    }

    try {
      const response = await fetch("/api/local-imports/preview-confirm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-atelier-local-import": "preview-confirm-local",
        },
        body: JSON.stringify({
          action,
          csvText,
          importType,
          productionApproved: false,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Local import request failed.");
      }

      const result = payload?.data as LocalImportUiResult;
      if (action === "preview") {
        setPreview(result);
      } else {
        setConfirmResult(result);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Local import request failed.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Card className="border-accent">
      <CardHeader
        title="Local import preview and confirm"
        description="Internal CSV text flow for Financial Statement and Market/PVT. Preview first, review audit, then explicitly confirm write."
        chip={<Chip variant="warning">local/internal</Chip>}
      />
      <CardBody className="space-y-5">
        {!enabled ? (
          <div className="rounded-[4px] border border-warning bg-warning/10 px-4 py-4 text-sm leading-6 text-ink">
            <p className="font-bold">Nhập dữ liệu local hiện đang tắt.</p>
            <p className="mt-2 text-muted">
              Chỉ bật chức năng này trong môi trường local/dev có kiểm soát.
            </p>
            <p className="mt-1 text-xs text-muted">
              Dữ liệu local/imported chưa được duyệt làm nguồn sản xuất (productionApproved: false).
            </p>
          </div>
        ) : null}
        <div className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft p-3 text-xs leading-5 text-muted md:grid-cols-4">
          <div>
            <p className="font-bold uppercase text-ink">Approval</p>
            <p>Chưa phê duyệt sản xuất</p>
          </div>
          <div>
            <p className="font-bold uppercase text-ink">Source</p>
            <p>local/imported; chưa phê duyệt sản xuất</p>
          </div>
          <div>
            <p className="font-bold uppercase text-ink">External API</p>
            <p>not used</p>
          </div>
          <div>
            <p className="font-bold uppercase text-ink">Confirm gate</p>
            <p>disabled until a dry-run preview succeeds</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <label className="text-xs font-bold uppercase text-muted">
            Import type
            <select
              className="mt-1 h-10 w-full rounded-[4px] border-[1.5px] border-border bg-white px-3 text-sm text-ink outline-none focus:border-accent"
              value={importType}
              onChange={(event) => {
                setImportType(event.target.value as LocalImportType);
                resetResult();
              }}
            >
              <option value="financial_statement">Financial Statement</option>
              <option value="market_pvt">Market/PVT</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCsvText(localImportTemplates[importType]);
                resetResult();
              }}
            >
              Use sample CSV
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCsvText("");
                resetResult();
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <label className="block text-xs font-bold uppercase text-muted">
          CSV text for {importTypeLabels[importType]}
          <textarea
            className="mt-2 min-h-[220px] w-full resize-y rounded-[4px] border-[1.5px] border-border bg-white px-3 py-3 font-mono text-xs leading-5 text-ink outline-none focus:border-accent"
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              resetResult();
            }}
            spellCheck={false}
            placeholder="Paste local CSV text here"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => runImportAction("preview")}
            disabled={!enabled || csvText.trim().length === 0 || pendingAction !== null}
            isLoading={pendingAction === "preview"}
          >
            Run dry-run preview
          </Button>
          <Button
            variant="secondary"
            onClick={() => runImportAction("confirm")}
            disabled={!enabled || !canConfirm || pendingAction !== null}
            isLoading={pendingAction === "confirm"}
          >
            Confirm write
          </Button>
        </div>

        {error ? <p className="rounded-[4px] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        {preview ? <AuditSummary title="Dry-run audit summary" audit={previewAudit} status={preview.status} /> : null}
        {confirmResult ? <AuditSummary title="Confirmed write audit summary" audit={confirmAudit} status={confirmResult.status} /> : null}
      </CardBody>
    </Card>
  );
}

function AuditSummary({
  audit,
  status,
  title,
}: {
  audit: LocalImportAudit | undefined;
  status: string | undefined;
  title: string;
}) {
  const warnings = messageList(audit, "warnings");
  const errors = messageList(audit, "errors");
  const rows: [string, number][] = [
    ["totalRows", readCount(audit, "totalRows")],
    ["validRows", readCount(audit, "validRows")],
    ["invalidRows", readCount(audit, "invalidRows")],
    ["writtenRows", readCount(audit, "writtenRows")],
    ["skippedRows", readCount(audit, "skippedRows")],
    ["duplicateSkippedRows", readCount(audit, "duplicateSkippedRows")],
  ];

  return (
    <div className="space-y-4 rounded-[4px] border border-border-soft bg-surface-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <Chip variant={errors.length > 0 ? "danger" : warnings.length > 0 ? "warning" : "success"}>{status ?? "unknown"}</Chip>
        <Chip variant="neutral">productionApproved:false</Chip>
      </div>
      <dl className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
            <dt className="text-[11px] font-bold uppercase text-muted">{label}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <MessageBlock title="Warnings" messages={warnings} fallback="No warnings reported. Check unit, source, and duplicate warnings here after preview." />
      <MessageBlock title="Errors" messages={errors} fallback="No errors reported." />
    </div>
  );
}

function MessageBlock({ fallback, messages, title }: { fallback: string; messages: string[]; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted">{title}</p>
      {messages.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-xs leading-5 text-ink">
          {messages.map((message, index) => (
            <li key={`${message}-${index}`} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
              {message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs leading-5 text-muted">{fallback}</p>
      )}
    </div>
  );
}
