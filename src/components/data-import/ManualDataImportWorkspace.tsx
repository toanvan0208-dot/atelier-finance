"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import {
  buildManualUploadPreview,
  type ManualUploadPreviewResult,
  type ManualUploadPreviewStatus,
} from "@/lib/data-sources";

const sampleCsv = [
  "ticker,period,companyType,source,asOf,revenue,netIncome,operatingCashFlow,totalAssets,equity,eps,bvps,sharesOutstanding,closePrice,volume,tradingValue",
  "AAA,2024Q4,non_financial,manual_upload,2025-03-31,1200000000000,98000000000,85000000000,3200000000000,1450000000000,1200,18000,82000000,24500,1500000,36750000000",
].join("\n");

const statusVariant: Record<ManualUploadPreviewStatus | "pass" | "failed", "neutral" | "success" | "warning" | "danger"> = {
  ready: "success",
  pass: "success",
  needs_review: "warning",
  insufficient_data: "warning",
  unknown: "neutral",
  not_ready: "danger",
  failed: "danger",
};

const formatValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "chưa có dữ liệu";
  if (typeof value === "number") return Number.isFinite(value) ? new Intl.NumberFormat("vi-VN").format(value) : "không đủ dữ liệu";
  return value;
};

const warningText = (warnings: { code: string; message: string; field?: string }[]): string[] =>
  warnings.map((warning) => `${warning.code}${warning.field ? ` (${warning.field})` : ""}: ${warning.message}`);

function SummaryCards({ result }: { result: ManualUploadPreviewResult }) {
  const summary = result.report.summary;
  const selected = result.selectedRecord;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[
        ["Tổng dòng", summary.totalRows],
        ["Dòng hợp lệ", summary.validRows],
        ["Cần xem lại", summary.warningRows],
        ["Có lỗi", summary.errorRows],
      ].map(([label, value]) => (
        <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-xl font-bold text-ink">{value}</p>
        </div>
      ))}
      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:col-span-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Trạng thái</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip variant={statusVariant[result.status]}>preview: {result.status}</Chip>
          <Chip variant={statusVariant[result.report.status]}>report: {result.report.status}</Chip>
          <Chip variant={statusVariant[result.report.readiness]}>readiness: {result.report.readiness}</Chip>
        </div>
      </div>
      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:col-span-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Record đang xem</p>
        <p className="mt-1 text-sm font-bold text-ink">
          {selected
            ? `${selected.financialStatement?.ticker ?? selected.marketData?.ticker ?? selected.valuationInput?.ticker ?? "N/A"} - ${
                selected.financialStatement?.metadata.period?.value ??
                selected.marketData?.metadata.period?.value ??
                selected.valuationInput?.metadata.period?.value ??
                "N/A"
              }`
            : "chưa chọn record"}
        </p>
      </div>
    </div>
  );
}

function MetadataPanel({ result }: { result: ManualUploadPreviewResult }) {
  const metadata = result.metadata;
  return (
    <Card>
      <CardHeader title="Metadata nguồn" description="Metadata được preserve từ canonical record hoặc bridge output." />
      <CardBody>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase text-muted">source</dt>
            <dd className="mt-1 text-ink">{formatValue(metadata?.source)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-muted">asOf</dt>
            <dd className="mt-1 text-ink">{formatValue(metadata?.asOf)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-muted">period</dt>
            <dd className="mt-1 text-ink">{formatValue(metadata?.period?.value)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-muted">sourceType</dt>
            <dd className="mt-1 text-ink">{formatValue(metadata?.sourceType)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-muted">isDemoData</dt>
            <dd className="mt-1 text-ink">{String(metadata?.isDemoData ?? false)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-muted">isStale</dt>
            <dd className="mt-1 text-ink">{String(metadata?.isStale ?? false)}</dd>
          </div>
        </dl>
        {metadata?.missingFields.length ? (
          <p className="mt-4 text-xs leading-5 text-muted">Missing fields: {metadata.missingFields.join(", ")}</p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function RecordPicker({
  onPick,
  result,
}: {
  onPick: (ticker: string, period: string) => void;
  result: ManualUploadPreviewResult;
}) {
  if (result.availableRecords.length <= 1) return null;

  return (
    <Card>
      <CardHeader
        title="Record picker"
        description="Có nhiều record hợp lệ. Chọn ticker và kỳ dữ liệu rồi chạy kiểm tra lại để tránh tự chọn sai."
      />
      <CardBody className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="border-b border-border-soft px-2 py-2">Row</th>
              <th className="border-b border-border-soft px-2 py-2">Ticker</th>
              <th className="border-b border-border-soft px-2 py-2">Period</th>
              <th className="border-b border-border-soft px-2 py-2">asOf</th>
              <th className="border-b border-border-soft px-2 py-2">Readiness</th>
              <th className="border-b border-border-soft px-2 py-2">Chọn</th>
            </tr>
          </thead>
          <tbody>
            {result.availableRecords.map((record) => (
              <tr key={`${record.rowIndex}-${record.ticker ?? "na"}-${record.period ?? "na"}`}>
                <td className="border-b border-border-soft px-2 py-2">{record.rowIndex}</td>
                <td className="border-b border-border-soft px-2 py-2">{formatValue(record.ticker)}</td>
                <td className="border-b border-border-soft px-2 py-2">{formatValue(record.period)}</td>
                <td className="border-b border-border-soft px-2 py-2">{formatValue(record.asOf)}</td>
                <td className="border-b border-border-soft px-2 py-2">
                  <Chip variant={statusVariant[record.readiness]}>{record.readiness}</Chip>
                </td>
                <td className="border-b border-border-soft px-2 py-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onPick(record.ticker ?? "", record.period ?? "")}
                    disabled={!record.ticker || !record.period}
                  >
                    Chọn
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

function IssuesPanel({ result }: { result: ManualUploadPreviewResult }) {
  return (
    <Card>
      <CardHeader title="Validation report" description="Report được tạo từ Phase 28B/28C pipeline, UI chỉ render kết quả." />
      <CardBody className="space-y-5">
        <div>
          <h3 className="text-sm font-bold text-ink">Top issues</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {result.report.topIssues.slice(0, 5).map((issue) => (
              <li key={`${issue.issueCode}-${issue.affectedFields.join(".")}`} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <span className="font-bold text-ink">[{issue.severity}]</span> {issue.message}
                <span className="block text-xs">Action: {issue.suggestedAction}</span>
              </li>
            ))}
            {result.report.topIssues.length === 0 ? <li>Không có issue lớn trong preview hiện tại.</li> : null}
          </ul>
        </div>
        <div className="overflow-x-auto">
          <h3 className="text-sm font-bold text-ink">Field coverage</h3>
          <table className="mt-2 min-w-full text-left text-xs">
            <thead className="uppercase text-muted">
              <tr>
                <th className="border-b border-border-soft px-2 py-2">Field</th>
                <th className="border-b border-border-soft px-2 py-2">Present</th>
                <th className="border-b border-border-soft px-2 py-2">Missing</th>
                <th className="border-b border-border-soft px-2 py-2">Invalid</th>
                <th className="border-b border-border-soft px-2 py-2">Modules</th>
              </tr>
            </thead>
            <tbody>
              {result.report.fieldCoverage.map((field) => (
                <tr key={field.fieldName}>
                  <td className="border-b border-border-soft px-2 py-2 font-bold text-ink">{field.fieldName}</td>
                  <td className="border-b border-border-soft px-2 py-2">{field.presentCount}</td>
                  <td className="border-b border-border-soft px-2 py-2">{field.missingCount}</td>
                  <td className="border-b border-border-soft px-2 py-2">{field.invalidCount}</td>
                  <td className="border-b border-border-soft px-2 py-2">{field.requiredForModules.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-[4px] border border-border-soft bg-ink px-4 py-3 text-xs leading-5 text-white">
          {result.markdownReport}
        </pre>
      </CardBody>
    </Card>
  );
}

function ModuleReadiness({ result }: { result: ManualUploadPreviewResult }) {
  const entries = Object.entries(result.diagnostics.moduleReadiness);
  return (
    <Card>
      <CardHeader title="Module readiness" description="Readiness theo module sau khi normalize dữ liệu upload." />
      <CardBody className="grid gap-3 md:grid-cols-2">
        {entries.map(([moduleName, readiness]) => (
          <div key={moduleName} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold capitalize text-ink">{moduleName}</p>
              <Chip variant={statusVariant[readiness.status]}>{readiness.status}</Chip>
            </div>
            {readiness.missing.length ? <p className="mt-2 text-xs text-muted">Missing: {readiness.missing.join(", ")}</p> : null}
            {readiness.blockedReasons.length ? (
              <p className="mt-1 text-xs text-muted">Blocked: {readiness.blockedReasons.join("; ")}</p>
            ) : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function FinancialsPreview({ result }: { result: ManualUploadPreviewResult }) {
  const statement = result.selectedRecord?.financialStatement;
  const preview = result.financialsPreview;
  const rows = [
    ["revenue", statement?.revenue],
    ["netIncome", statement?.netIncome],
    ["operatingCashFlow", statement?.operatingCashFlow],
    ["totalAssets", statement?.totalAssets],
    ["equity", statement?.equity],
    ["ROA contract metric", preview.input?.contractMetrics.roa.value],
    ["CFOA contract metric", preview.input?.contractMetrics.cfoToAssets.value],
  ];

  return (
    <Card>
      <CardHeader title="Financials preview" chip={<Chip variant={statusVariant[preview.readiness]}>{preview.readiness}</Chip>} />
      <CardBody>
        <dl className="grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label as string} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <dt className="text-xs font-bold text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
        {preview.blockedReasons.length ? (
          <p className="mt-4 text-xs leading-5 text-danger">Không đủ dữ liệu: {preview.blockedReasons.join("; ")}</p>
        ) : null}
        {preview.warnings.length ? (
          <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
            {warningText(preview.warnings).map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}

function ValuationPreview({ result }: { result: ManualUploadPreviewResult }) {
  const market = result.selectedRecord?.marketData;
  const valuation = result.selectedRecord?.valuationInput;
  const preview = result.valuationPreview;
  const rows = [
    ["closePrice", market?.closePrice],
    ["eps", valuation?.eps],
    ["bvps", valuation?.bvps],
    ["sharesOutstanding", valuation?.sharesOutstanding],
    ["marketCap", valuation?.marketCap],
    ["P/E metric", preview.input?.moduleMetrics.peRatio.value],
    ["P/B metric", preview.input?.moduleMetrics.pbRatio.value],
    ["BVPS metric", preview.input?.moduleMetrics.bvps.value],
  ];
  const peStatus = preview.input?.contractMetrics.peInterpretation.interpretation;
  const equityStatus = preview.input?.contractMetrics.equityInterpretation.interpretation;

  return (
    <Card>
      <CardHeader title="Valuation preview" chip={<Chip variant={statusVariant[preview.readiness]}>{preview.readiness}</Chip>} />
      <CardBody>
        <dl className="grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label as string} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <dt className="text-xs font-bold text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-2 text-xs md:grid-cols-2">
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">P/E interpretation: {formatValue(peStatus)}</p>
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">Equity interpretation: {formatValue(equityStatus)}</p>
        </div>
        {preview.blockedReasons.length ? (
          <p className="mt-4 text-xs leading-5 text-danger">Không đủ dữ liệu: {preview.blockedReasons.join("; ")}</p>
        ) : null}
        {preview.warnings.length ? (
          <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
            {warningText(preview.warnings).map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function ManualDataImportWorkspace() {
  const [csvText, setCsvText] = useState(sampleCsv);
  const [targetTicker, setTargetTicker] = useState("AAA");
  const [targetPeriod, setTargetPeriod] = useState("2024Q4");
  const [result, setResult] = useState<ManualUploadPreviewResult | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const canRun = useMemo(() => csvText.trim().length > 0, [csvText]);

  const runPreview = (ticker = targetTicker, period = targetPeriod) => {
    setUiError(null);
    try {
      const preview = buildManualUploadPreview({
        kind: "csv",
        csvText,
        batch: {
          isDemoData: true,
        },
        options: {
          mode: "thesis_verification",
          targetTicker: ticker.trim() || undefined,
          targetPeriod: period.trim() || undefined,
          allowedModules: ["financials", "valuation"],
        },
      });
      setResult(preview);
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "Không thể tạo preview dữ liệu.");
      setResult(null);
    }
  };

  const pickRecord = (ticker: string, period: string) => {
    setTargetTicker(ticker);
    setTargetPeriod(period);
    runPreview(ticker, period);
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-ink md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border-soft pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Phase 28D</p>
            <h1 className="mt-1 text-2xl font-black text-ink">Manual Data Import Workspace</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Workspace này chỉ kiểm tra chất lượng, readiness và preview module từ dữ liệu người dùng nhập thủ công.
              Dữ liệu chưa được duyệt cho production runtime và có thể bị giới hạn bởi missing hoặc sai nguồn.
            </p>
          </div>
          <Chip variant="warning">mode: thesis_verification</Chip>
        </section>

        <Card>
          <CardHeader
            title="CSV input"
            description="Hỗ trợ CSV đơn giản. Quoted CSV, dấu phẩy bên trong ô và cấu trúc phức tạp chưa được hỗ trợ ở workspace này."
            action={
              <Button onClick={() => runPreview()} disabled={!canRun}>
                Kiểm tra dữ liệu
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <textarea
              className="min-h-[220px] w-full resize-y rounded-[4px] border-[1.5px] border-border bg-white px-3 py-3 font-mono text-xs leading-5 text-ink outline-none focus:border-accent"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              spellCheck={false}
              placeholder="ticker,period,source,asOf,netIncome,totalAssets,equity,eps,closePrice"
            />
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs font-bold uppercase text-muted">
                targetTicker
                <input
                  className="mt-1 h-10 w-full rounded-[4px] border-[1.5px] border-border bg-white px-3 text-sm text-ink outline-none focus:border-accent"
                  value={targetTicker}
                  onChange={(event) => setTargetTicker(event.target.value)}
                  placeholder="AAA"
                />
              </label>
              <label className="text-xs font-bold uppercase text-muted">
                targetPeriod
                <input
                  className="mt-1 h-10 w-full rounded-[4px] border-[1.5px] border-border bg-white px-3 text-sm text-ink outline-none focus:border-accent"
                  value={targetPeriod}
                  onChange={(event) => setTargetPeriod(event.target.value)}
                  placeholder="2024Q4"
                />
              </label>
              <div className="flex items-end gap-2">
                <Button variant="secondary" onClick={() => setCsvText(sampleCsv)}>
                  Dữ liệu mẫu
                </Button>
                <Button variant="ghost" onClick={() => setResult(null)}>
                  Xóa preview
                </Button>
              </div>
            </div>
            {uiError ? <p className="rounded-[4px] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{uiError}</p> : null}
            <p className="text-xs leading-5 text-muted">
              Missing value phải giữ nguyên là trống, null, NA hoặc N/A. Workspace không thay missing thành 0.
            </p>
          </CardBody>
        </Card>

        {result ? (
          <>
            <SummaryCards result={result} />
            {result.diagnostics.unmatchedTargetReason ? (
              <p className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3 text-sm text-ink">
                {result.diagnostics.unmatchedTargetReason}
              </p>
            ) : null}
            <RecordPicker result={result} onPick={pickRecord} />
            <div className="grid gap-5 lg:grid-cols-2">
              <MetadataPanel result={result} />
              <ModuleReadiness result={result} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <FinancialsPreview result={result} />
              <ValuationPreview result={result} />
            </div>
            <IssuesPanel result={result} />
          </>
        ) : (
          <Card>
            <CardBody>
              <p className="text-sm text-muted">Dán CSV hoặc dùng dữ liệu mẫu, sau đó bấm “Kiểm tra dữ liệu” để tạo preview.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
