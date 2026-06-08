import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MacroTone, MacroWarningSignal } from "../types";

type MacroWarningDashboardProps = {
  signals: MacroWarningSignal[];
};

const cadenceOrder: MacroWarningSignal["cadence"][] = [
  "Tháng",
  "Quý",
  "Khủng hoảng",
];

const toneClasses: Record<MacroTone, string> = {
  support: "border-accent-green/60 bg-accent-green/5",
  pressure: "border-danger/60 bg-danger/5",
  neutral: "border-border-soft bg-neutral/45",
  watch: "border-warning/70 bg-warning/10",
  mixed: "border-border bg-accent-soft/45",
};

const statusVariant: Record<
  MacroWarningSignal["status"],
  "neutral" | "accent" | "success" | "warning" | "danger"
> = {
  "Tín hiệu xanh": "success",
  "Tín hiệu vàng": "warning",
  "Tín hiệu đỏ": "danger",
  "Chưa đủ dữ liệu": "neutral",
};

export function MacroWarningDashboard({ signals }: MacroWarningDashboardProps) {
  return (
    <div className="grid gap-4">
      {cadenceOrder.map((cadence) => {
        const cadenceSignals = signals.filter((signal) => signal.cadence === cadence);

        return (
          <section
            key={cadence}
            className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Dashboard {cadence.toLowerCase()}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Theo dõi tín hiệu, bằng chứng, ý nghĩa dễ hiểu, ngành liên
                  quan và hành động tiếp theo.
                </p>
              </div>
              <Chip variant="accent">{cadenceSignals.length} tín hiệu</Chip>
            </div>

            <div className="mt-4 grid gap-3">
              {cadenceSignals.map((signal) => (
                <article
                  key={signal.id}
                  className={cn("rounded-[4px] border px-3 py-3", toneClasses[signal.tone])}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{signal.signal}</h4>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {signal.meaning}
                      </p>
                    </div>
                    <Chip size="sm" variant={statusVariant[signal.status]}>
                      {signal.status}
                    </Chip>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                        Bằng chứng
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {signal.evidence}
                      </p>
                    </div>
                    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                        Ngành liên quan
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {signal.relatedSectors.map((sector) => (
                          <Chip key={sector} size="sm">
                            {sector}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-subtle">
                        Hành động tiếp theo
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {signal.nextAction}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
