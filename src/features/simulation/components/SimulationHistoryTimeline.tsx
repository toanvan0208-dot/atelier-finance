import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { SimulationHistoryEvent } from "../types";

type SimulationHistoryTimelineProps = {
  events: SimulationHistoryEvent[];
};

export function SimulationHistoryTimeline({ events }: SimulationHistoryTimelineProps) {
  return (
    <Card>
      <CardHeader
        title="Lịch sử mô phỏng"
        description="Các sự kiện được ghi lại để hậu kiểm quy trình, không phải lịch sử giao dịch thật."
        chip={<Chip variant="neutral">{events.length} sự kiện</Chip>}
      />
      <CardBody>
        <div className="grid gap-3">
          {events.map((event) => (
            <div key={event.id} className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-bold text-ink">{event.timestamp}</p>
                {event.symbol ? <p className="mt-1 text-[11px] font-semibold text-accent">{event.symbol}</p> : null}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{event.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
