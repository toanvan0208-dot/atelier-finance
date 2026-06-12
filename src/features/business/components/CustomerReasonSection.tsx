import { Button, Card, CardBody } from "@/components/ui";
import type { BusinessJourneyCustomersData } from "../types";

type CustomerReasonSectionProps = {
  data: BusinessJourneyCustomersData;
  onDeepDive: () => void;
};

const columns = [
  { key: "mainCustomers", title: "Ai trả tiền?" },
  { key: "whatTheyBuy", title: "Họ mua gì?" },
  { key: "whyTheyBuy", title: "Vì sao họ chọn công ty này?" },
] as const;

export function CustomerReasonSection({ data, onDeepDive }: CustomerReasonSectionProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-7 text-ink">{data.question}</h2>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-muted">{data.shortExplanation}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onDeepDive}>
            Xem sâu hơn
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {columns.map((column) => (
            <section key={column.key} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <h3 className="text-sm font-bold text-ink">{column.title}</h3>
              <div className="mt-3 space-y-2">
                {data[column.key].slice(0, 4).map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-muted">
            <span className="font-bold text-ink">Mua lặp lại: </span>
            {data.repeatBehavior}
          </p>
          <p className="rounded-[4px] border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-muted">
            <span className="font-bold text-ink">Nhạy với giá: </span>
            {data.priceSensitivity}
          </p>
        </div>

        <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3">
          <p className="text-[11px] font-bold uppercase text-subtle">Nhà đầu tư mới cần nhớ</p>
          <p className="mt-1 text-sm font-bold leading-6 text-ink">{data.practicalConclusion}</p>
        </div>
      </CardBody>
    </Card>
  );
}
