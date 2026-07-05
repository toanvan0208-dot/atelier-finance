import { Card, CardBody, Chip } from "@/components/ui";
import type { RiskRedesignData, RiskRedesignTone } from "../types";

type RiskHeroSummaryProps = {
  data: RiskRedesignData;
};

const toneVariant: Record<RiskRedesignTone, "success" | "warning" | "danger" | "neutral"> = {
  ready: "success",
  check: "warning",
  blocked: "danger",
  missing: "neutral",
};

export function RiskHeroSummary({ data }: RiskHeroSummaryProps) {
  const primaryRisks = data.topRisks.slice(0, 3);

  return (
    <Card>
      <CardBody className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="accent">Rủi ro và dữ liệu còn thiếu</Chip>
            <Chip variant={toneVariant[data.overall.tone]}>{data.overall.status}</Chip>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase text-subtle">
            {data.ticker} · {data.companyName} · {data.industry}
          </p>
          <h1 className="mt-2 font-brand text-3xl font-bold leading-tight text-ink md:text-4xl">
            Còn thiếu dữ liệu nào trước khi hình thành nhận định?
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink">{data.overall.conclusion}</p>
          <div className="mt-5 grid max-w-3xl gap-2 rounded-[4px] border border-border-soft bg-surface-soft p-4">
            <p className="text-sm font-bold text-ink">Trạng thái đúng của module này</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">Không chấm điểm</p>
                <p className="mt-1 text-xs leading-5 text-muted">Không tạo thang điểm khi dữ liệu còn thiếu.</p>
              </div>
              <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">Chỉ soi thiếu</p>
                <p className="mt-1 text-xs leading-5 text-muted">Giữ các trường thiếu ở trạng thái cần kiểm tra.</p>
              </div>
              <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
                <p className="text-[11px] font-bold uppercase text-subtle">Dẫn về nguồn</p>
                <p className="mt-1 text-xs leading-5 text-muted">Ưu tiên quay lại Financials, Valuation và bối cảnh.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
          <p className="text-sm font-bold text-ink">Luồng kiểm tra của trang này</p>
          <div className="mt-4 space-y-3">
            {primaryRisks.map((risk, index) => (
              <div key={risk.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-[3px] border border-border-soft bg-surface text-xs font-bold text-ink">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-bold leading-5 text-ink">{risk.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{risk.priority}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border-soft pt-4">
            <p className="text-[11px] font-bold uppercase text-subtle">Không trình bày lại</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Trang này chỉ chỉ ra lỗ hổng cần xác minh, còn cách đọc số liệu chi tiết nằm ở module nguồn.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
