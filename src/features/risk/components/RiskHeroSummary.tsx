import { Card, CardBody, Chip } from "@/components/ui";
import type { RiskRedesignData, RiskRedesignTone } from "../types";

type RiskHeroSummaryProps = {
  data: RiskRedesignData;
};

const toneVariant: Record<RiskRedesignTone, "success" | "warning" | "danger" | "neutral"> = {
  low: "success",
  caution: "warning",
  high: "danger",
  missing: "neutral",
};

export function RiskHeroSummary({ data }: RiskHeroSummaryProps) {
  const scoreLabel = data.overall.score === null ? "N/A" : data.overall.score;
  const scoreHelper =
    data.overall.score === null
      ? "Chưa đủ dữ liệu để chấm điểm."
      : "Thang 100, càng cao càng cần kiểm tra kỹ.";

  return (
    <Card>
      <CardBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Tổng quan rủi ro trọng yếu</Chip>
            <Chip variant={toneVariant[data.overall.tone]}>{data.overall.status}</Chip>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase text-subtle">
            {data.ticker} · {data.companyName} · {data.industry}
          </p>
          <h1 className="mt-2 font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
            Cổ phiếu này có rủi ro nào đủ lớn để làm luận điểm đầu tư sai không?
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink">{data.overall.conclusion}</p>
          <div className="mt-5 flex max-w-xs items-center gap-4 rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
            <div className="grid h-16 w-16 place-items-center rounded-full border-[6px] border-warning bg-surface text-lg font-bold text-ink">
              {scoreLabel}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Điểm rủi ro</p>
              <p className="mt-1 text-xs leading-5 text-muted">{scoreHelper}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Top 3 rủi ro chính</p>
            <div className="mt-3 space-y-2">
              {data.topRisks.map((risk, index) => (
                <p key={risk.id} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs font-semibold leading-5 text-ink">
                  {index + 1}. {risk.title}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Dữ liệu còn thiếu quan trọng</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.missingEvidence.map((item) => (
                <Chip key={item} size="sm" variant="neutral">{item}</Chip>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
