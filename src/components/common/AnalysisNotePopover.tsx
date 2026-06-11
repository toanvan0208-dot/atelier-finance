"use client";

import { useMemo, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AnalysisNote, AnalysisNoteType } from "@/types/analysis-note";

type AnalysisNotePopoverProps = {
  stockSymbol?: string;
  moduleId: string;
  moduleName: string;
  contextTitle?: string;
  initialNote?: AnalysisNote;
  noteType?: AnalysisNoteType;
  promptHints?: string[];
  sampleNote?: string;
  triggerLabel?: string;
  onSave?: (note: AnalysisNote) => void;
  onDelete?: (noteId: string) => void;
};

const noteTypeLabels: Record<AnalysisNoteType, string> = {
  personal: "Ghi chú cá nhân",
  assumption: "Giả định",
  follow_up: "Điều cần kiểm tra thêm",
  counter_thesis: "Phản biện thesis",
  lesson: "Bài học rút ra",
};

const promptHints = [
  "Tôi đang nghĩ gì về dữ liệu này?",
  "Giả định nào của tôi chưa được kiểm chứng?",
  "Điều gì có thể làm thesis sai?",
  "Tôi cần kiểm tra thêm ở module nào?",
];

function createId(moduleId: string, stockSymbol?: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `analysis-note-${stockSymbol ?? "module"}-${moduleId}-${random}`;
}

function readStoredNote(storageKey: string, initialNote?: AnalysisNote) {
  if (initialNote || typeof window === "undefined") return initialNote;

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AnalysisNote) : undefined;
  } catch {
    return undefined;
  }
}

export function AnalysisNotePopover({
  contextTitle,
  initialNote,
  moduleId,
  moduleName,
  noteType = "personal",
  onDelete,
  onSave,
  promptHints: customPromptHints,
  sampleNote,
  stockSymbol,
  triggerLabel = "Ghi chú phân tích",
}: AnalysisNotePopoverProps) {
  const storageKey = useMemo(
    () => `atelier-analysis-note:${stockSymbol ?? "module"}:${moduleId}:${contextTitle ?? "default"}`,
    [contextTitle, moduleId, stockSymbol]
  );
  const initialSavedNote = useMemo(() => readStoredNote(storageKey, initialNote), [initialNote, storageKey]);
  const [isOpen, setIsOpen] = useState(false);
  const [savedNote, setSavedNote] = useState<AnalysisNote | undefined>(() => initialSavedNote);
  const [type, setType] = useState<AnalysisNoteType>(() => initialSavedNote?.type ?? noteType);
  const [content, setContent] = useState(() => initialSavedNote?.content ?? "");
  const [savedMessage, setSavedMessage] = useState("");
  const visiblePromptHints = customPromptHints?.length ? customPromptHints : promptHints;

  function handleSave() {
    const now = new Date().toISOString();
    const nextNote: AnalysisNote = {
      id: savedNote?.id ?? initialNote?.id ?? createId(moduleId, stockSymbol),
      stockSymbol,
      moduleId,
      moduleName,
      type,
      title: contextTitle,
      content: content.trim(),
      createdAt: savedNote?.createdAt ?? initialNote?.createdAt ?? now,
      updatedAt: now,
    };

    setSavedNote(nextNote);
    window.localStorage.setItem(storageKey, JSON.stringify(nextNote));
    onSave?.(nextNote);
    setSavedMessage("Đã lưu ghi chú.");
  }

  function handleDelete() {
    if (savedNote?.id) {
      onDelete?.(savedNote.id);
    }

    window.localStorage.removeItem(storageKey);
    setSavedNote(undefined);
    setContent("");
    setSavedMessage("");
  }

  const hasNote = Boolean(content.trim() || savedNote?.content.trim());

  return (
    <>
      <Button
        size="sm"
        variant={hasNote ? "primary" : "secondary"}
        onClick={() => setIsOpen(true)}
      >
        {hasNote ? "Có ghi chú" : triggerLabel}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Đóng ghi chú phân tích"
            className="absolute inset-0 bg-ink/35"
            type="button"
            onClick={() => setIsOpen(false)}
          />
          <aside
            aria-label="Ghi chú phân tích"
            className={cn(
              "absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto border-t-[1.5px] border-border bg-page shadow-hard",
              "px-5 py-5 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:w-[420px] md:rounded-[4px] md:border-[1.5px]"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
                  Ghi chú phân tích
                </p>
                <h2 className="mt-1 text-lg font-bold text-ink">
                  {contextTitle ?? moduleName}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stockSymbol ? <Chip size="sm">{stockSymbol}</Chip> : null}
                  <Chip size="sm" variant="accent">{moduleName}</Chip>
                  <Chip size="sm" variant="neutral">{noteTypeLabels[type]}</Chip>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsOpen(false)}>
                Đóng
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-ink">Loại ghi chú</span>
                <select
                  className="h-9 rounded-[4px] border border-border-soft bg-surface px-2 text-sm font-semibold text-ink outline-none focus:border-border"
                  value={type}
                  onChange={(event) => setType(event.target.value as AnalysisNoteType)}
                >
                  {Object.entries(noteTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-ink">Nội dung</span>
                <textarea
                  className="min-h-44 resize-y rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-subtle focus:bg-accent-soft/35"
                  placeholder="Viết nhận định, giả định hoặc điều cần kiểm tra thêm của bạn..."
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setSavedMessage("");
                  }}
                />
              </label>
            </div>

            <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              {hasNote ? (
                <p className="text-xs font-semibold leading-5 text-muted">
                  Ghi chú đang được lưu cục bộ trên trình duyệt cho module này.
                </p>
              ) : (
                <p className="text-xs font-semibold leading-5 text-muted">
                  Chưa có ghi chú nào cho phần này.
                </p>
              )}
              <div className="mt-3 grid gap-1.5">
                {visiblePromptHints.map((hint) => (
                  <button
                    key={hint}
                    className="rounded-[3px] border border-border-soft bg-surface px-2 py-1.5 text-left text-xs font-semibold text-muted transition hover:border-border hover:text-ink"
                    type="button"
                    onClick={() => setContent((current) => (current ? `${current}\n${hint} ` : `${hint} `))}
                  >
                    {hint}
                  </button>
                ))}
              </div>
              {sampleNote ? (
                <button
                  className="mt-3 rounded-[3px] border border-border-soft bg-accent-soft px-3 py-2 text-left text-xs leading-5 text-muted transition hover:border-border hover:text-ink"
                  type="button"
                  onClick={() => setContent((current) => (current ? `${current}\n${sampleNote}` : sampleNote))}
                >
                  <span className="block font-bold uppercase text-subtle">Mẫu ghi chú</span>
                  <span className="mt-1 block">{sampleNote}</span>
                </button>
              ) : null}
            </div>

            {savedMessage ? (
              <p className="mt-3 rounded-[3px] border border-[#7CCFAF] bg-[#DDF7EC] px-3 py-2 text-xs font-bold text-[#0F6B50]">
                {savedMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button disabled={!content.trim()} onClick={handleSave}>
                Lưu ghi chú
              </Button>
              <Button variant="secondary" onClick={handleDelete}>
                Xóa
              </Button>
              <Button variant="ghost" onClick={handleSave} disabled={!content.trim()}>
                Gửi vào Checklist
              </Button>
              <Button variant="ghost" onClick={handleSave} disabled={!content.trim()}>
                Ghim vào Watchlist
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
