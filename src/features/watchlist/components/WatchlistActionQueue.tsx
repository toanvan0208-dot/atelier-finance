"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockIdea, WatchlistActionQueueItem, WatchlistPriority } from "../types";

type WatchlistActionQueueProps = {
  ideas: StockIdea[];
  onOpenIdea: (ticker: string) => void;
};

const priorityTone: Record<WatchlistPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

const priorityLabel: Record<WatchlistPriority, string> = {
  low: "Thấp",
  medium: "Vừa",
  high: "Cao",
};

function inferPriority(idea: StockIdea): WatchlistPriority {
  if (idea.priority.toLowerCase().includes("cao") || idea.alerts.some((alert) => alert.tone === "danger")) {
    return "high";
  }

  if (idea.priority.toLowerCase().includes("vừa") || idea.status === "Cần xem lại") {
    return "medium";
  }

  return "low";
}

function buildQueue(ideas: StockIdea[]): WatchlistActionQueueItem[] {
  return ideas
    .map((idea): WatchlistActionQueueItem => {
      if (!idea.thesis || idea.thesis.toLowerCase().includes("chưa có thesis")) {
        return {
          id: `${idea.ticker}-missing-thesis`,
          ticker: idea.ticker,
          title: "Viết thesis ban đầu",
          reason: "Chưa có lý do theo dõi rõ ràng, dễ dẫn đến FOMO.",
          priority: "high",
          relatedModule: "Watchlist",
          ctaLabel: "Viết thesis",
          moduleKey: "watchlist",
        };
      }

      if (idea.status === "Cần xem lại") {
        return {
          id: `${idea.ticker}-review`,
          ticker: idea.ticker,
          title: "Cập nhật lại dữ liệu liên quan",
          reason: idea.latestNote || "Có dữ liệu hoặc cảnh báo mới cần kiểm chứng.",
          priority: inferPriority(idea),
          relatedModule: idea.missingModules[0] ?? "Watchlist",
          ctaLabel: "Xem chi tiết",
          moduleKey: "watchlist",
          reviewDate: idea.events[0]?.date,
        };
      }

      if (idea.status === "Sẵn sàng mô phỏng") {
        return {
          id: `${idea.ticker}-simulation`,
          ticker: idea.ticker,
          title: "Tạo mô phỏng kịch bản",
          reason: "Đã có thesis và rủi ro sơ bộ, có thể chuyển sang theo dõi giả lập.",
          priority: inferPriority(idea),
          relatedModule: "Mô phỏng",
          ctaLabel: "Tạo mô phỏng",
          moduleKey: "simulation",
        };
      }

      if (idea.status === "Tạm loại") {
        return {
          id: `${idea.ticker}-paused`,
          ticker: idea.ticker,
          title: "Xem lại lý do tạm loại",
          reason: idea.pauseReason ?? "Ý tưởng chưa đủ cơ sở để tiếp tục ưu tiên.",
          priority: "medium",
          relatedModule: "Watchlist",
          ctaLabel: "Xem lý do",
          moduleKey: "watchlist",
        };
      }

      return {
        id: `${idea.ticker}-next`,
        ticker: idea.ticker,
        title: idea.nextStep,
        reason: idea.validationQuestion,
        priority: inferPriority(idea),
        relatedModule: idea.missingModules[0] ?? "Watchlist",
        ctaLabel: "Xem chi tiết",
        moduleKey: "watchlist",
        reviewDate: idea.events[0]?.date,
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);
}

export function WatchlistActionQueue({ ideas, onOpenIdea }: WatchlistActionQueueProps) {
  const queue = buildQueue(ideas);

  return (
    <Card>
      <CardHeader title="Hàng đợi cần xử lý" description="Ưu tiên việc cần kiểm chứng, ghi chú hoặc cập nhật trước." />
      <CardBody className="space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 md:grid-cols-[72px_minmax(0,1fr)_160px]"
          >
            <div>
              <p className="font-brand text-lg font-bold text-ink">{item.ticker}</p>
              <Chip size="sm" variant={priorityTone[item.priority]}>
                Ưu tiên {priorityLabel[item.priority]}
              </Chip>
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.relatedModule ? <Chip size="sm" variant="neutral">{item.relatedModule}</Chip> : null}
                {item.reviewDate ? <Chip size="sm" variant="warning">{item.reviewDate}</Chip> : null}
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOpenIdea(item.ticker)}>
              {item.ctaLabel}
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
