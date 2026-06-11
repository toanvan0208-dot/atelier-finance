"use client";

import { useState } from "react";
import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import { Button, Card, CardBody, CardHeader, Chip, Tabs } from "@/components/ui";
import type { AnalysisNote } from "@/types/analysis-note";
import { cn } from "@/lib/cn";
import type {
  SimulationTrackingData,
  StockIdea,
  WatchlistJournalEntry,
} from "../types";
import { StockEventBadge } from "./StockEventBadge";
import {
  FieldGrid,
  ModuleStatusBadge,
  StatusBadge,
  TagList,
  TextStack,
} from "./WatchlistPrimitives";
import { WatchlistSoftAlert } from "./WatchlistSoftAlert";

type WatchlistInsightPanelProps = {
  data: StockIdea;
  isOpen: boolean;
  onClose: () => void;
  simulationTracking: SimulationTrackingData;
};

function getSimulationItem(data: SimulationTrackingData, ticker: string) {
  return data.items.find((item) => item.ticker === ticker);
}

function getThesisStatus(data: StockIdea) {
  if (data.status === "Tạm loại") return "Tạm loại";
  if (!data.thesis || data.thesis.toLowerCase().includes("chưa có thesis")) return "Chưa có";
  if (data.status === "Sẵn sàng mô phỏng") return "Có cơ sở sơ bộ";
  if (data.alerts.some((alert) => alert.tone === "danger")) return "Bị phủ định một phần";
  return "Đang kiểm chứng";
}

function buildJournalEntries(data: StockIdea): WatchlistJournalEntry[] {
  const entries: WatchlistJournalEntry[] = [
    {
      id: `${data.ticker}-added`,
      ticker: data.ticker,
      createdAt: data.addedDate,
      type: "added",
      relatedModule: "Watchlist",
      content: `Thêm vào Watchlist từ ${data.ideaSource}.`,
      nextStatus: data.status,
    },
    {
      id: `${data.ticker}-thesis`,
      ticker: data.ticker,
      createdAt: "2026-06-12",
      type: "thesis_updated",
      relatedModule: "BCTC",
      content: data.latestNote,
    },
  ];

  if (data.status === "Tạm loại") {
    entries.push({
      id: `${data.ticker}-paused`,
      ticker: data.ticker,
      createdAt: "2026-06-14",
      type: "paused",
      relatedModule: "Rủi ro",
      content: data.pauseReason ?? "Tạm loại vì dữ liệu hoặc thesis chưa đủ rõ.",
      previousStatus: "Cần xem lại",
      nextStatus: "Tạm loại",
    });
  }

  return entries;
}

const journalTypeLabels: Record<WatchlistJournalEntry["type"], string> = {
  added: "Thêm vào Watchlist",
  event_added: "Sự kiện mới",
  module_completed: "Hoàn thành module",
  paused: "Tạm loại",
  personal_note: "Ghi chú cá nhân",
  resumed: "Đưa lại vào theo dõi",
  risk_found: "Phát hiện rủi ro",
  thesis_updated: "Cập nhật thesis",
  valuation_updated: "Cập nhật định giá",
};

export function WatchlistInsightPanel({
  data,
  isOpen,
  onClose,
  simulationTracking,
}: WatchlistInsightPanelProps) {
  const simulationItem = getSimulationItem(simulationTracking, data.ticker);
  const [note, setNote] = useState("");
  const journalEntries = buildJournalEntries(data);

  function handleAnalysisNoteSave(savedNote: AnalysisNote) {
    setNote(savedNote.content);
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={onClose} aria-hidden="true" />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full border-l-[1.5px] border-border bg-page p-3 shadow-hard transition-transform duration-200 md:max-w-[620px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isOpen}
        aria-label={`Chi tiết Watchlist ${data.ticker}`}
      >
        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader
            action={
              <Button size="sm" variant="secondary" onClick={onClose}>
                Đóng
              </Button>
            }
            chip={<StatusBadge status={data.status} />}
            description={`${data.companyName} · ${data.industry}`}
            icon={data.ticker.slice(0, 2)}
            title={`Hồ sơ ý tưởng ${data.ticker}`}
          />
          <CardBody className="min-h-0 flex-1 overflow-y-auto">
            <Tabs
              ariaLabel="Chi tiết Watchlist"
              items={[
                {
                  value: "overview",
                  label: "Tổng quan",
                  content: (
                    <div className="space-y-4">
                      <FieldGrid
                        items={[
                          { label: "Mã", value: data.ticker, tone: "accent" },
                          { label: "Doanh nghiệp", value: data.companyName },
                          { label: "Ngành", value: data.industry },
                          { label: "Trạng thái", value: data.status },
                          { label: "Ưu tiên", value: data.priority },
                          { label: "Giá hiện tại", value: data.currentPrice },
                          { label: "30 ngày", value: data.recentMove },
                          { label: "Thanh khoản", value: data.liquidity },
                        ]}
                      />
                      <TextStack items={[data.thesis, `Rủi ro chính: ${data.risks[0] ?? "Chưa rõ"}`, `Bước tiếp theo: ${data.nextStep}`]} />
                      <TagList tags={data.tags} />
                    </div>
                  ),
                },
                {
                  value: "thesis",
                  label: "Thesis",
                  content: (
                    <div className="space-y-4">
                      <FieldGrid
                        items={[
                          { label: "Trạng thái thesis", value: getThesisStatus(data), tone: data.status === "Tạm loại" ? "danger" : "warning" },
                          { label: "Lý do thêm vào Watchlist", value: data.reason },
                          { label: "Thesis hiện tại", value: data.thesis },
                          { label: "Điều muốn kiểm chứng", value: data.validationQuestion },
                        ]}
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-bold text-ink">Điều làm thesis mạnh hơn</p>
                          <TextStack items={data.confirmingData} />
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-bold text-ink">Điều làm thesis yếu đi</p>
                          <TextStack items={data.invalidatingData} />
                        </div>
                      </div>
                      {data.pauseReason ? (
                        <div className="rounded-[4px] border border-[#E6A29B] bg-[#FBE3DC] px-3 py-3 text-xs leading-5 text-muted">
                          <strong className="text-ink">Lý do tạm loại:</strong> {data.pauseReason}
                          <br />
                          Có thể đưa lại vào theo dõi nếu dữ liệu nền, thesis và rủi ro được kiểm chứng rõ hơn.
                        </div>
                      ) : null}
                      <Button size="sm" variant="secondary">Cập nhật thesis</Button>
                    </div>
                  ),
                },
                {
                  value: "progress",
                  label: "Tiến độ phân tích",
                  content: (
                    <div className="space-y-2">
                      {data.progress.map((item) => (
                        <div key={item.moduleName} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-ink">{item.moduleName}</p>
                              <p className="mt-1 text-xs leading-5 text-muted">{item.question}</p>
                            </div>
                            <ModuleStatusBadge status={item.status} />
                          </div>
                          <Button className="mt-3" size="sm" variant="secondary">{item.actionLabel}</Button>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  value: "data",
                  label: "Dữ liệu cần cập nhật",
                  content: (
                    <div className="space-y-2">
                      {data.dataToUpdate.map((item, index) => (
                        <div key={item} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-ink">{item}</p>
                            <Chip size="sm" variant={index === 0 ? "warning" : "neutral"}>{index === 0 ? "Ưu tiên cao" : "Cần cập nhật"}</Chip>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            Dùng để kiểm tra thesis hiện tại có còn phù hợp không.
                          </p>
                          <Button className="mt-3" size="sm" variant="secondary">Mở module liên quan</Button>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  value: "events",
                  label: "Sự kiện",
                  content: (
                    <div className="space-y-3">
                      {data.events.length ? (
                        data.events.map((event) => (
                          <div key={`${event.label}-${event.date}`} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                            <StockEventBadge event={event} />
                            <p className="mt-2 text-xs leading-5 text-muted">
                              Cần theo dõi tác động, không kết luận nguyên nhân nếu chỉ là tương quan.
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
                          Chưa có sự kiện gần cần ưu tiên.
                        </div>
                      )}
                      {data.alerts.map((alert) => (
                        <WatchlistSoftAlert key={alert.title} data={alert} />
                      ))}
                    </div>
                  ),
                },
                {
                  value: "simulation",
                  label: "Mô phỏng",
                  content: simulationItem ? (
                    <div className="space-y-4">
                      <FieldGrid
                        items={[
                          { label: "Trạng thái mô phỏng", value: simulationItem.thesisStatus },
                          { label: "Kịch bản cơ sở", value: simulationItem.requiredUpdate },
                          { label: "Điều kiện xem lại", value: simulationItem.nextReviewMilestone },
                          { label: "Nhật ký mô phỏng", value: simulationItem.journalStatus },
                        ]}
                      />
                      <TextStack
                        items={[
                          "Kịch bản xấu: dữ liệu xác nhận thesis suy yếu hoặc rủi ro tăng.",
                          "Kịch bản tốt: dữ liệu mới xác nhận thesis và rủi ro được kiểm soát.",
                          simulationItem.softWarning,
                        ]}
                      />
                      <Button size="sm" variant="secondary">Mở mô phỏng</Button>
                    </div>
                  ) : (
                    <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-sm leading-6 text-muted">
                      Chưa đủ dữ liệu để mô phỏng. Cần hoàn thiện thesis, định giá và rủi ro trước.
                    </div>
                  ),
                },
                {
                  value: "journal",
                  label: "Nhật ký",
                  content: (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {journalEntries.map((entry) => (
                          <div key={entry.id} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Chip size="sm" variant="neutral">{entry.createdAt}</Chip>
                              <Chip size="sm" variant="accent">{journalTypeLabels[entry.type]}</Chip>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted">{entry.content}</p>
                            {entry.relatedModule ? <p className="mt-1 text-xs font-bold text-subtle">Module: {entry.relatedModule}</p> : null}
                          </div>
                        ))}
                      </div>
                      <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-ink">Ghi chú phân tích về {data.ticker}</p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {note.trim() ? note : "Chưa có ghi chú cá nhân mới trong phiên này."}
                            </p>
                          </div>
                          <AnalysisNotePopover
                            contextTitle={`Ghi chú phân tích về ${data.ticker}`}
                            moduleId={`watchlist-drawer-${data.ticker}`}
                            moduleName="Watchlist"
                            noteType="personal"
                            onSave={handleAnalysisNoteSave}
                            stockSymbol={data.ticker}
                            triggerLabel={note.trim() ? "Xem ghi chú" : "Thêm ghi chú"}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </aside>
    </>
  );
}
