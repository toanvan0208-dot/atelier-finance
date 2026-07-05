import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { SimulationHistoryEvent } from "../types";

type SimulationHistoryTimelineProps = {
  events: SimulationHistoryEvent[];
};

const eventLabels: Record<SimulationHistoryEvent["type"], string> = {
  note_added: "Ghi chú",
  order_created: "Nháp",
  position_closed: "Đóng",
  position_opened: "Mở",
  scenario_reviewed: "Kịch bản",
  stop_loss_updated: "Cảnh báo",
  target_updated: "Theo dõi",
};

export function SimulationHistoryTimeline({ events }: SimulationHistoryTimelineProps) {
  return (
    <Card>
      <CardHeader
        title="Nhật ký hậu kiểm"
        description="Ghi lại lý do, mốc theo dõi và bài học để lần sau nhìn lại được quy trình."
        chip={<Chip variant="neutral">{events.length} sự kiện</Chip>}
      />
      <CardBody>
        {events.length === 0 ? (
          <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-6 text-sm leading-6 text-muted">
            Chưa có sự kiện nào. Khi bạn tạo tình huống hoặc ghi chú, nhật ký sẽ hiện ở đây.
          </div>
        ) : (
          <div className="relative grid gap-3">
            <div className="absolute bottom-4 left-[18px] top-4 w-px bg-border-soft" />
            {events.map((event) => (
              <article key={event.id} className="relative grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3 sm:grid-cols-[170px_minmax(0,1fr)]">
                <div className="flex items-start gap-3">
                  <span className="relative z-[1] grid size-9 place-items-center rounded-full border border-border bg-surface text-[11px] font-bold text-ink">
                    {eventLabels[event.type].slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-ink">{event.timestamp}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Chip size="sm" variant="neutral">{eventLabels[event.type]}</Chip>
                      {event.symbol ? <Chip size="sm" variant="accent">{event.symbol}</Chip> : null}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{event.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{event.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
