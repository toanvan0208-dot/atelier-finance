"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { StockIdea } from "../types";

type WatchlistDisciplinePanelProps = {
  ideas: StockIdea[];
  onOpenIdea: (ticker: string) => void;
};

function missingThesisIdeas(ideas: StockIdea[]) {
  return ideas.filter((idea) => !idea.thesis || idea.thesis.toLowerCase().includes("chưa có thesis"));
}

function fomoIdeas(ideas: StockIdea[]) {
  return ideas.filter((idea) =>
    idea.tags.some((tag) => tag.toLowerCase().includes("fomo")) ||
    idea.risks.some((risk) => risk.toLowerCase().includes("fomo")) ||
    idea.emotionalState.toLowerCase().includes("fomo")
  );
}

function pausedIdeas(ideas: StockIdea[]) {
  return ideas.filter((idea) => idea.status === "Tạm loại");
}

export function WatchlistDisciplinePanel({
  ideas,
  onOpenIdea,
}: WatchlistDisciplinePanelProps) {
  const groups = [
    {
      title: "Mã thiếu lý do theo dõi",
      description: "Cần viết thesis hoặc lý do theo dõi rõ.",
      items: missingThesisIdeas(ideas),
      cta: "Viết thesis",
    },
    {
      title: "Mã có dấu hiệu FOMO",
      description: "Giá/tin tức dễ kéo cảm xúc nếu thiếu dữ liệu.",
      items: fomoIdeas(ideas),
      cta: "Kiểm tra FOMO",
    },
    {
      title: "Mã nên cân nhắc tạm loại",
      description: "Giữ kỷ luật khi thesis hoặc dữ liệu chưa đủ rõ.",
      items: pausedIdeas(ideas),
      cta: "Xem lý do",
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Kỷ luật Watchlist"
        description="Giúp không giữ quá nhiều ý tưởng chỉ vì FOMO hoặc tiếc công phân tích."
      />
      <CardBody className="grid gap-3 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">{group.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{group.description}</p>
              </div>
              <Chip size="sm" variant="neutral">{group.items.length}</Chip>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.slice(0, 3).map((idea) => (
                <div key={`${group.title}-${idea.ticker}`} className="rounded-[4px] border border-border-soft bg-surface px-3 py-2">
                  <p className="text-sm font-bold text-ink">{idea.ticker}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {idea.pauseReason ?? idea.latestNote ?? idea.reason}
                  </p>
                  <Button className="mt-2" size="sm" variant="secondary" onClick={() => onOpenIdea(idea.ticker)}>
                    {group.cta}
                  </Button>
                </div>
              ))}
              {group.items.length === 0 ? (
                <p className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                  Chưa có mã trong nhóm này.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
