import { Button, Chip } from "@/components/ui";
import type { BusinessDeepDiveData } from "../types";

type DeepDiveDrawerProps = {
  data: BusinessDeepDiveData | null;
  onClose: () => void;
};

export function DeepDiveDrawer({ data, onClose }: DeepDiveDrawerProps) {
  if (!data) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[760px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-5 py-4">
          <div>
            <Chip variant="accent">Xem sâu hơn</Chip>
            <h2 className="mt-2 text-lg font-bold text-ink">{data.title}</h2>
            {data.plainLanguage ? (
              <p className="mt-1 max-w-[68ch] text-sm leading-6 text-muted">{data.plainLanguage}</p>
            ) : null}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>

        <div className="grid max-h-[72dvh] gap-4 overflow-y-auto px-5 py-5 md:grid-cols-3">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-ink">Câu hỏi cần tự kiểm tra</h3>
            {data.checklist.map((item) => (
              <p key={item} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                {item}
              </p>
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-ink">Dấu hiệu ngoài đời cần quan sát</h3>
            {data.realWorldSignals.map((item) => (
              <p key={item} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
                {item}
              </p>
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-ink">Cần kiểm chứng ở đâu?</h3>
            <div className="flex flex-wrap gap-2">
              {data.verifyIn.map((item) => (
                <Chip key={item} variant="neutral">
                  {item}
                </Chip>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
