import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessJourneyIdentityData } from "../types";

type BusinessIdentityCardProps = {
  data: BusinessJourneyIdentityData;
  isSample: boolean;
  onDeepDive: () => void;
};

export function BusinessIdentityCard({ data, isSample, onDeepDive }: BusinessIdentityCardProps) {
  return (
    <Card className="border-border bg-surface">
      <CardBody className="space-y-4 px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">Hiểu nhanh trong 30 giây</Chip>
          <Chip variant="neutral">{data.ticker}</Chip>
          <Chip variant="neutral">{data.businessType}</Chip>
          {isSample ? <Chip variant="warning">Dữ liệu mẫu</Chip> : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-ink md:text-[30px]">
              {data.question}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              {data.companyName}
            </p>
            <p className="mt-4 max-w-[78ch] text-base font-bold leading-7 text-ink">
              {data.simpleDescription}
            </p>
            <p className="mt-3 max-w-[78ch] text-sm leading-6 text-muted">
              {data.coreMessage}
            </p>
          </div>

          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-xs font-bold text-ink">Nhà đầu tư mới cần nhớ</p>
            <p className="mt-2 text-sm leading-6 text-muted">{data.beginnerRemember}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.modelTags.map((tag) => (
                <Chip key={tag} size="sm" variant="neutral">
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border-soft pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Tính chất mô hình</p>
            <p className="mt-1 text-sm leading-6 text-muted">{data.cycleType}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-subtle">Kết luận thực chiến</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink">{data.practicalConclusion}</p>
          </div>
          <Button size="sm" variant="primary" onClick={onDeepDive}>
            Xem bản chất mô hình
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
