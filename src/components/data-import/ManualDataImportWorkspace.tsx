"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import {
  saveManualImportSession,
  type ManualImportSaveResult,
} from "@/lib/data-sources/manual-import-api-client";
import {
  buildManualUploadPreview,
  type ManualUploadPreviewResult,
  type ManualUploadPreviewStatus,
} from "@/lib/data-sources/manual-upload-preview-bridge";
import type { ManualUploadIssueSeverity } from "@/lib/data-sources/manual-upload-report";

const templateCsv = [
  "ticker,period,revenue,netIncome,operatingCashFlow,totalAssets,equity,eps,bvps,sharesOutstanding,closePrice,volume,tradingValue,source,asOf",
  "FPTLAB,2024Q4,62000000000000,9300000000000,8500000000000,72000000000000,31000000000000,5200,21000,1000000000,95000,1200000,114000000000,manual_upload,2025-01-31",
].join("\n");

const statusVariant: Record<ManualUploadPreviewStatus | "pass", "neutral" | "success" | "warning" | "danger"> = {
  ready: "success",
  pass: "success",
  needs_review: "warning",
  insufficient_data: "warning",
  unknown: "neutral",
  not_ready: "danger",
  failed: "danger",
};

const statusLabel: Record<ManualUploadPreviewStatus | "pass", string> = {
  ready: "Đủ dữ liệu để xem preview",
  pass: "Đủ dữ liệu để xem preview",
  needs_review: "Cần kiểm tra thêm",
  not_ready: "Chưa sẵn sàng",
  insufficient_data: "Không đủ dữ liệu",
  failed: "Không đọc được dữ liệu",
  unknown: "Chưa rõ trạng thái",
};

const severityLabel: Record<ManualUploadIssueSeverity, string> = {
  info: "Thông tin",
  warning: "Cảnh báo",
  error: "Lỗi dữ liệu",
  critical: "Lỗi nghiêm trọng",
};

const fieldGroups = [
  {
    title: "Required",
    description: "Cần có để định danh record và nguồn dữ liệu.",
    fields: ["ticker", "period", "source", "asOf"],
  },
  {
    title: "Financials recommended",
    description: "Giúp preview Financials đầy đủ hơn.",
    fields: ["revenue", "netIncome", "operatingCashFlow", "totalAssets", "equity"],
  },
  {
    title: "Valuation recommended",
    description: "Giúp preview các chỉ số định giá từ dữ liệu đã nhập.",
    fields: ["closePrice", "eps", "bvps", "sharesOutstanding"],
  },
  {
    title: "PVT recommended",
    description: "Giúp xem bối cảnh giá và thanh khoản.",
    fields: ["closePrice", "volume", "tradingValue"],
  },
  {
    title: "Optional / context",
    description: "Bổ sung ngữ cảnh, không nên tự điền nếu không có nguồn.",
    fields: ["companyType", "currency", "unit", "previousClose", "totalDebt", "currentAssets", "currentLiabilities"],
  },
];

const lineCount = (text: string): number =>
  text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0).length;

const formatValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "chưa có dữ liệu";
  if (typeof value === "number") return Number.isFinite(value) ? new Intl.NumberFormat("vi-VN").format(value) : "không đủ dữ liệu";
  return value;
};

const warningText = (warnings: { code: string; message: string; field?: string }[]): string[] =>
  warnings.map((warning) => `${warning.code}${warning.field ? ` (${warning.field})` : ""}: ${warning.message}`);

function StatusBadge({ status }: { status: ManualUploadPreviewStatus | "pass" }) {
  return <Chip variant={statusVariant[status]}>{statusLabel[status]}</Chip>;
}

function DataSourceWarningCard() {
  const rows = [
    ["Source mode", "user-provided / manual_upload"],
    ["Runtime mode", "thesis_verification"],
    ["Production source", "not approved"],
    ["Server storage", "manual session audit only"],
    ["External API", "not used"],
    ["Investment advice", "none"],
  ];

  return (
    <Card className="border-warning bg-warning/10">
      <CardHeader
        title="Cảnh báo phạm vi dữ liệu"
        description="Dữ liệu này do người dùng cung cấp. Hệ thống không xác minh nguồn ngoài trong bước này. Kết quả chỉ là kiểm tra dữ liệu và preview phân tích, không phải khuyến nghị đầu tư."
      />
      <CardBody>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}

function CsvTemplateCard({ onUseTemplate }: { onUseTemplate: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Template CSV"
        description="Số liệu bên dưới chỉ minh họa cấu trúc cột, không phải dữ liệu đã xác minh."
        action={
          <Button variant="secondary" onClick={onUseTemplate}>
            Dùng template mẫu
          </Button>
        }
      />
      <CardBody>
        <pre className="overflow-x-auto rounded-[4px] border border-border-soft bg-ink px-4 py-3 text-xs leading-5 text-white">
          {templateCsv}
        </pre>
      </CardBody>
    </Card>
  );
}

function FieldGuide() {
  return (
    <Card>
      <CardHeader title="Field guide" description="Các cột nên có trong CSV để preview dễ hiểu và ít thiếu dữ liệu." />
      <CardBody className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {fieldGroups.map((group) => (
            <div key={group.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <h3 className="text-sm font-bold text-ink">{group.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{group.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.fields.map((field) => (
                  <Chip key={field} size="sm" variant={group.title === "Required" ? "warning" : "neutral"}>
                    {field}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ul className="grid gap-2 text-xs leading-5 text-muted md:grid-cols-2">
          <li>Thiếu field thì hệ thống không tự điền 0.</li>
          <li>Dữ liệu thiếu sẽ được đánh dấu “chưa có dữ liệu”.</li>
          <li>EPS &lt;= 0 thì P/E không áp dụng.</li>
          <li>Equity &lt;= 0 thì ROE/P/B/BVPS không diễn giải bình thường.</li>
          <li>Dữ liệu khác VND không tự convert nếu thiếu tỷ giá và nguồn.</li>
          <li>Nếu có nhiều record và thiếu target, hệ thống yêu cầu chọn record.</li>
        </ul>
      </CardBody>
    </Card>
  );
}

function SummaryCards({ result }: { result: ManualUploadPreviewResult }) {
  const summary = result.report.summary;
  const selected = result.selectedRecord;
  const selectedName = selected
    ? `${selected.financialStatement?.ticker ?? selected.marketData?.ticker ?? selected.valuationInput?.ticker ?? "N/A"} - ${
        selected.financialStatement?.metadata.period?.value ??
        selected.marketData?.metadata.period?.value ??
        selected.valuationInput?.metadata.period?.value ??
        "N/A"
      }`
    : "chưa chọn record";

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[
        ["Tổng dòng", summary.totalRows],
        ["Dòng hợp lệ", summary.validRows],
        ["Cần kiểm tra", summary.warningRows],
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
          <StatusBadge status={result.status} />
          <StatusBadge status={result.report.status} />
          <StatusBadge status={result.report.readiness} />
        </div>
      </div>
      <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:col-span-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Record đang xem</p>
        <p className="mt-1 text-sm font-bold text-ink">{selectedName}</p>
      </div>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function PersistencePanel({
  canSave,
  onSave,
  saveError,
  saveState,
  savedSession,
}: {
  canSave: boolean;
  onSave: () => void;
  saveError: string | null;
  saveState: SaveState;
  savedSession: ManualImportSaveResult | null;
}) {
  return (
    <Card>
      <CardHeader
        title="Lưu phiên nhập dữ liệu"
        description="Lưu audit trail cho dữ liệu do người dùng cung cấp. Phiên này vẫn cần kiểm tra lại và không được coi là nguồn dữ liệu đã duyệt."
        action={
          <Button onClick={onSave} disabled={!canSave || saveState === "saving"} isLoading={saveState === "saving"}>
            {saveState === "saved" ? "Đã lưu phiên" : "Lưu phiên nhập"}
          </Button>
        }
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          {[
            ["Trạng thái", saveState === "idle" ? "chưa lưu" : saveState],
            ["sourceType", savedSession?.sourceType ?? "user_input"],
            ["dataMode", savedSession?.dataMode ?? "user_input"],
            ["productionApproved", String(savedSession?.productionApproved ?? false)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 font-bold text-ink">{value}</dd>
            </div>
          ))}
        </div>

        {savedSession ? (
          <div className="rounded-[4px] border border-success bg-success/10 px-3 py-3 text-sm text-ink">
            <p className="font-bold">Session ID: {savedSession.sessionId}</p>
            <p className="mt-1 text-xs font-bold text-muted">
              productionApproved: {String(savedSession.productionApproved)}
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {[
                ["status", savedSession.status],
                ["readiness", savedSession.readiness],
                ["totalRows", savedSession.counts.totalRows],
                ["validRows", savedSession.counts.validRows],
                ["warningRows", savedSession.counts.warningRows],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[3px] border border-border-soft bg-surface px-2 py-2">
                  <p className="text-[11px] font-bold uppercase text-muted">{label}</p>
                  <p className="mt-1 font-bold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Dữ liệu đã được lưu để audit/preview workflow, không tự động đưa vào module chính.
            </p>
          </div>
        ) : null}

        {saveError ? (
          <p className="rounded-[4px] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
            {saveError}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function MetadataPanel({ result }: { result: ManualUploadPreviewResult }) {
  const metadata = result.metadata;
  return (
    <Card>
      <CardHeader title="Metadata nguồn" description="Metadata được giữ từ canonical record hoặc bridge output." />
      <CardBody>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          {[
            ["source", metadata?.source],
            ["asOf", metadata?.asOf],
            ["period", metadata?.period?.value],
            ["sourceType", metadata?.sourceType],
            ["isDemoData", String(metadata?.isDemoData ?? false)],
            ["isStale", String(metadata?.isStale ?? false)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
              <dd className="mt-1 text-ink">{formatValue(value)}</dd>
            </div>
          ))}
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

  const duplicateWarning = [...result.financialsPreview.warnings, ...result.valuationPreview.warnings].some(
    (warning) => warning.code === "DUPLICATE_TARGET_MATCH",
  );

  return (
    <Card>
      <CardHeader
        title="Chọn record"
        description="Có nhiều record hợp lệ. Hãy nhập targetTicker/targetPeriod để chọn chính xác."
      />
      <CardBody className="space-y-3 overflow-x-auto">
        <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-sm text-ink">
          Hệ thống không tự chọn khi thiếu target rõ ràng. Chọn một dòng bên dưới hoặc nhập mã và kỳ dữ liệu cần xem.
        </p>
        {duplicateWarning ? (
          <p className="rounded-[4px] border border-warning bg-warning/15 px-3 py-2 text-sm text-ink">
            Có nhiều dòng trùng mã và kỳ dữ liệu. Hệ thống chọn dòng đầu tiên để preview và yêu cầu kiểm tra lại.
          </p>
        ) : null}
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="border-b border-border-soft px-2 py-2">Row</th>
              <th className="border-b border-border-soft px-2 py-2">Ticker</th>
              <th className="border-b border-border-soft px-2 py-2">Period</th>
              <th className="border-b border-border-soft px-2 py-2">asOf</th>
              <th className="border-b border-border-soft px-2 py-2">Readiness</th>
              <th className="border-b border-border-soft px-2 py-2">Action</th>
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
                  <StatusBadge status={record.readiness} />
                </td>
                <td className="border-b border-border-soft px-2 py-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onPick(record.ticker ?? "", record.period ?? "")}
                    disabled={!record.ticker || !record.period}
                  >
                    Chọn record
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
      <CardHeader title="Validation report" description="Report được tạo từ pipeline 28A-28C; UI chỉ trình bày kết quả." />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold uppercase text-muted">Overall status</p>
            <div className="mt-2"><StatusBadge status={result.report.status} /></div>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold uppercase text-muted">Readiness</p>
            <div className="mt-2"><StatusBadge status={result.report.readiness} /></div>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <p className="text-xs font-bold uppercase text-muted">Selected row</p>
            <p className="mt-2 text-sm font-bold text-ink">{result.diagnostics.selectedRowIndex ?? "chưa chọn"}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink">Top issues</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {result.report.topIssues.slice(0, 6).map((issue) => (
              <li key={`${issue.issueCode}-${issue.affectedFields.join(".")}`} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
                <span className="font-bold text-ink">[{severityLabel[issue.severity]}]</span> {issue.message}
                <span className="block text-xs">Cần sửa: {issue.suggestedAction}</span>
              </li>
            ))}
            {result.report.topIssues.length === 0 ? <li>Không có lỗi lớn trong preview hiện tại.</li> : null}
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

        <div>
          <h3 className="text-sm font-bold text-ink">Safe next steps</h3>
          <ul className="mt-2 grid gap-2 text-sm text-muted md:grid-cols-2">
            {result.diagnostics.safeNextSteps.map((step) => (
              <li key={step} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">{step}</li>
            ))}
          </ul>
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
      <CardHeader title="Module readiness" description="Trạng thái sẵn sàng dữ liệu theo module sau khi normalize dữ liệu upload." />
      <CardBody className="grid gap-3 md:grid-cols-2">
        {entries.map(([moduleName, readiness]) => (
          <div key={moduleName} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold capitalize text-ink">{moduleName}</p>
              <StatusBadge status={readiness.status} />
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
    ["Revenue", statement?.revenue],
    ["Net income", statement?.netIncome],
    ["Operating cash flow", statement?.operatingCashFlow],
    ["Total assets", statement?.totalAssets],
    ["Equity", statement?.equity],
    ["ROA contract metric", preview.input?.contractMetrics.roa.value],
    ["CFOA contract metric", preview.input?.contractMetrics.cfoToAssets.value],
  ];

  return (
    <Card>
      <CardHeader title="Financials preview" chip={<StatusBadge status={preview.readiness} />} />
      <CardBody>
        <p className="mb-4 text-xs leading-5 text-muted">Preview này chỉ phản ánh dữ liệu đã nhập trong CSV.</p>
        <dl className="grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label as string} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <dt className="text-xs font-bold text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
        {preview.blockedReasons.length ? (
          <p className="mt-4 text-xs leading-5 text-danger">Không đủ dữ liệu để tính: {preview.blockedReasons.join("; ")}</p>
        ) : null}
        {preview.warnings.length ? (
          <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
            {warningText(preview.warnings).map((warning, index) => <li key={`${warning}-${index}`}>Cần kiểm tra thêm: {warning}</li>)}
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
    ["Close price", market?.closePrice],
    ["EPS", valuation?.eps],
    ["BVPS", valuation?.bvps],
    ["Shares outstanding", valuation?.sharesOutstanding],
    ["Market cap", valuation?.marketCap],
    ["P/E metric", preview.input?.moduleMetrics.peRatio.value],
    ["P/B metric", preview.input?.moduleMetrics.pbRatio.value],
    ["BVPS metric", preview.input?.moduleMetrics.bvps.value],
  ];
  const epsNotPositive = (valuation?.eps ?? 1) <= 0;
  const equityNotPositive = (result.selectedRecord?.financialStatement?.equity ?? 1) <= 0;
  const missingClosePrice = !market?.closePrice || market.closePrice <= 0;

  return (
    <Card>
      <CardHeader title="Valuation preview" chip={<StatusBadge status={preview.readiness} />} />
      <CardBody>
        <p className="mb-4 text-xs leading-5 text-muted">Preview này dùng dữ liệu đã nhập, không tạo kết luận giao dịch.</p>
        <dl className="grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label as string} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <dt className="text-xs font-bold text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-2 text-xs md:grid-cols-2">
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            P/E interpretation: {formatValue(preview.input?.contractMetrics.peInterpretation.interpretation)}
          </p>
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
            Equity interpretation: {formatValue(preview.input?.contractMetrics.equityInterpretation.interpretation)}
          </p>
        </div>
        <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
          {epsNotPositive ? <li>P/E không áp dụng do EPS không dương.</li> : null}
          {equityNotPositive ? <li>Một số chỉ số dựa trên vốn chủ sở hữu không diễn giải bình thường.</li> : null}
          {missingClosePrice ? <li>Chưa có giá đóng cửa để tạo preview định giá.</li> : null}
        </ul>
        {preview.blockedReasons.length ? (
          <p className="mt-4 text-xs leading-5 text-danger">Không đủ dữ liệu: {preview.blockedReasons.join("; ")}</p>
        ) : null}
        {preview.warnings.length ? (
          <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
            {warningText(preview.warnings).map((warning, index) => <li key={`${warning}-${index}`}>Cần kiểm tra thêm: {warning}</li>)}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}

function EmptyState({ onUseTemplate }: { onUseTemplate: () => void }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-bold text-ink">Chưa có preview dữ liệu</h2>
          <p className="mt-1 text-sm text-muted">Bắt đầu bằng cách dán CSV hoặc dùng template mẫu.</p>
        </div>
        <Button variant="secondary" onClick={onUseTemplate}>Dùng template mẫu</Button>
      </CardBody>
    </Card>
  );
}

const userFacingError = (result: ManualUploadPreviewResult): string | null => {
  if (result.adapterResult.errors.some((error) => error.code === "CSV_EMPTY")) return "CSV đang trống. Hãy dán dữ liệu hoặc dùng template mẫu.";
  if (result.adapterResult.errors.some((error) => error.code === "CSV_HEADER_INVALID")) return "Header CSV chưa hợp lệ. Hãy kiểm tra tên cột và cột bị trống.";
  if (result.adapterResult.errors.some((error) => error.code === "CSV_PARSE_UNSUPPORTED")) return "CSV có quoted field hoặc cấu trúc phức tạp chưa được hỗ trợ. Hãy dùng CSV đơn giản.";
  if (result.report.summary.validRows === 0) return "Không có dòng hợp lệ để preview. Hãy xem Top issues và sửa dữ liệu.";
  if (result.report.topIssues.some((issue) => issue.category === "missing_as_of")) return "Một số dòng thiếu asOf. Hãy thêm ngày nguồn dữ liệu cho từng record.";
  if (result.diagnostics.unmatchedTargetReason) return result.diagnostics.unmatchedTargetReason;
  return null;
};

export function ManualDataImportWorkspace() {
  const [csvText, setCsvText] = useState("");
  const [targetTicker, setTargetTicker] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("");
  const [result, setResult] = useState<ManualUploadPreviewResult | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedSession, setSavedSession] = useState<ManualImportSaveResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canRun = useMemo(() => csvText.trim().length > 0 && !isProcessing, [csvText, isProcessing]);
  const canSave = useMemo(
    () => Boolean(result) && csvText.trim().length > 0 && saveState !== "saving",
    [csvText, result, saveState],
  );
  const rowsEstimate = useMemo(() => lineCount(csvText), [csvText]);

  const resetSaveState = () => {
    setSaveState("idle");
    setSavedSession(null);
    setSaveError(null);
  };

  const useTemplate = () => {
    setCsvText(templateCsv);
    setTargetTicker("FPT");
    setTargetPeriod("2024Q4");
    setResult(null);
    setUiError(null);
    resetSaveState();
  };

  const clearAll = () => {
    setCsvText("");
    setTargetTicker("");
    setTargetPeriod("");
    setResult(null);
    setUiError(null);
    resetSaveState();
  };

  const runPreview = (ticker = targetTicker, period = targetPeriod) => {
    setUiError(null);
    resetSaveState();
    setIsProcessing(true);
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
      setUiError(userFacingError(preview));
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "Không thể tạo preview dữ liệu.");
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const pickRecord = (ticker: string, period: string) => {
    setTargetTicker(ticker);
    setTargetPeriod(period);
    runPreview(ticker, period);
  };

  const saveSession = async () => {
    if (!result || !csvText.trim()) return;

    setSaveState("saving");
    setSaveError(null);
    try {
      const session = await saveManualImportSession({
        csvText,
        sourceLabel: "manual_upload",
        fileName: "manual-import.csv",
        targetTicker: targetTicker.trim() || undefined,
        targetPeriod: targetPeriod.trim() || undefined,
      });
      setSavedSession(session);
      setSaveState("saved");
    } catch (error) {
      setSavedSession(null);
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Không thể lưu phiên nhập dữ liệu.");
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-ink md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border-soft pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Phase 28E</p>
            <h1 className="mt-1 text-2xl font-black text-ink">Nhập dữ liệu thủ công</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Dán dữ liệu CSV do bạn cung cấp để hệ thống kiểm tra chất lượng dữ liệu và tạo preview Financials/Valuation.
            </p>
          </div>
          <Chip variant="warning">thesis_verification</Chip>
        </section>

        <DataSourceWarningCard />
        <CsvTemplateCard onUseTemplate={useTemplate} />
        <FieldGuide />

        <Card>
          <CardHeader
            title="CSV input"
            description="Hỗ trợ CSV đơn giản. Quoted CSV, dấu phẩy bên trong ô và cấu trúc phức tạp chưa được hỗ trợ."
            action={
              <Button onClick={() => runPreview()} disabled={!canRun} isLoading={isProcessing}>
                Kiểm tra dữ liệu
              </Button>
            }
          />
          <CardBody className="space-y-4">
            <label className="block text-xs font-bold uppercase text-muted">
              CSV do người dùng cung cấp
              <textarea
                className="mt-2 min-h-[300px] w-full resize-y rounded-[4px] border-[1.5px] border-border bg-white px-3 py-3 font-mono text-xs leading-5 text-ink outline-none focus:border-accent"
                value={csvText}
                onChange={(event) => {
                  setCsvText(event.target.value);
                  setResult(null);
                  setUiError(null);
                  resetSaveState();
                }}
                spellCheck={false}
                placeholder="ticker,period,source,asOf,netIncome,totalAssets,equity,eps,closePrice"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Ước tính dòng có dữ liệu: {rowsEstimate}</span>
              <span>Target bỏ trống + nhiều record: hệ thống sẽ yêu cầu chọn record, không tự chọn.</span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs font-bold uppercase text-muted">
                Mã cần xem
                <input
                  className="mt-1 h-10 w-full rounded-[4px] border-[1.5px] border-border bg-white px-3 text-sm text-ink outline-none focus:border-accent"
                  value={targetTicker}
                  onChange={(event) => setTargetTicker(event.target.value)}
                  placeholder="FPT"
                />
              </label>
              <label className="text-xs font-bold uppercase text-muted">
                Kỳ dữ liệu cần xem
                <input
                  className="mt-1 h-10 w-full rounded-[4px] border-[1.5px] border-border bg-white px-3 text-sm text-ink outline-none focus:border-accent"
                  value={targetPeriod}
                  onChange={(event) => setTargetPeriod(event.target.value)}
                  placeholder="2024Q4"
                />
              </label>
              <div className="flex items-end gap-2">
                <Button variant="secondary" onClick={useTemplate}>
                  Dùng template mẫu
                </Button>
                <Button variant="ghost" onClick={clearAll}>
                  Xóa dữ liệu
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
            <PersistencePanel
              canSave={canSave}
              onSave={saveSession}
              saveError={saveError}
              saveState={saveState}
              savedSession={savedSession}
            />
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
          <EmptyState onUseTemplate={useTemplate} />
        )}
      </div>
    </main>
  );
}
