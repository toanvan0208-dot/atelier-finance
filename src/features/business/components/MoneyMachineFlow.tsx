import { Button, Card, CardBody, Chip } from "@/components/ui";
import type { BusinessJourneyMoneyMachineData } from "../types";

type MoneyMachineFlowProps = {
  data: BusinessJourneyMoneyMachineData;
  onDeepDive: () => void;
};

const flowItems = [
  { key: "inputs", title: "Đầu vào" },
  { key: "operations", title: "Vận hành" },
  { key: "salesChannels", title: "Bán hàng" },
  { key: "cashCollection", title: "Thu tiền" },
  { key: "expansionMethod", title: "Mở rộng" },
] as const;

export function MoneyMachineFlow({ data, onDeepDive }: MoneyMachineFlowProps) {
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

        <div className="grid gap-2 lg:grid-cols-5">
          {flowItems.map((item, index) => (
            <section key={item.key} className="relative rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <Chip size="sm" variant="accent">
                  {String(index + 1).padStart(2, "0")}
                </Chip>
                {index < flowItems.length - 1 ? <span className="hidden text-xs font-bold text-subtle lg:block">→</span> : null}
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted">{data[item.key].slice(0, 2).join(", ")}.</p>
            </section>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[4px] border border-border-soft bg-surface px-4 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Ví dụ với mã đang chọn</p>
            <p className="mt-1 text-sm leading-6 text-muted">{data.example}</p>
          </div>
          <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
            <p className="text-[11px] font-bold uppercase text-subtle">Điểm nghẽn dễ làm mô hình hỏng</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.bottlenecks.slice(0, 5).map((item) => (
                <Chip key={item} size="sm" variant="warning">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-bold leading-6 text-ink">
          {data.practicalConclusion}
        </p>
      </CardBody>
    </Card>
  );
}
