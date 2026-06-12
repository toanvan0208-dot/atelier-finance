import { Chip } from "@/components/ui";
import type { FinancialReadingDeskData } from "../types";

type FinancialConclusionPanelProps = {
  data: FinancialReadingDeskData["conclusion"];
};

const columns = [
  {
    key: "confirmed",
    title: "BCTC xác nhận gì?",
    tone: "border-accent-green/40 bg-accent-green/5",
  },
  {
    key: "notConfirmed",
    title: "BCTC chưa xác nhận gì?",
    tone: "border-warning/60 bg-warning/10",
  },
  {
    key: "weakeningSignals",
    title: "Điều gì làm thesis yếu đi?",
    tone: "border-danger/40 bg-danger/5",
  },
] as const;

export function FinancialConclusionPanel({ data }: FinancialConclusionPanelProps) {
  return (
    <section className="rounded-[8px] border-[1.5px] border-border bg-canvas p-5 shadow-hard">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink">Kết luận sau khi đọc BCTC</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Chốt lại điều đã được xác nhận, điều còn thiếu và mức sẵn sàng để chuyển sang định giá.
          </p>
        </div>
        <Chip variant="warning">{data.readiness.status}</Chip>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <article key={column.key} className={`rounded-[6px] border p-4 ${column.tone}`}>
            <h3 className="text-sm font-extrabold text-ink">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-muted">
              {data[column.key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}

        <article className="rounded-[6px] border border-border-soft bg-surface p-4">
          <h3 className="text-sm font-extrabold text-ink">Sẵn sàng định giá?</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{data.readiness.reason}</p>
          <p className="mt-3 rounded-[4px] border border-border-soft bg-neutral px-3 py-2 text-xs leading-5 text-muted">
            Quy tắc: không định giá nếu dữ liệu dòng tiền và vốn lưu động còn bẩn.
          </p>
        </article>
      </div>
    </section>
  );
}
