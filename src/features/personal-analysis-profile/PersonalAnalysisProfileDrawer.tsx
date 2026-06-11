"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { usePersonalAnalysisProfile } from "./PersonalAnalysisProfileContext";
import { PersonalAnalysisProfileForm } from "./PersonalAnalysisProfileForm";
import { PersonalRoutePreview } from "./PersonalRoutePreview";
import { ProfilePreferenceSummary } from "./ProfilePreferenceSummary";
import { defaultPersonalAnalysisProfile } from "./profileOptions";
import type { PersonalAnalysisProfile } from "./types";

export function PersonalAnalysisProfileDrawer() {
  const {
    clearSavedMessage,
    closeDrawer,
    isDrawerOpen,
    profile,
    resetProfile,
    savedMessage,
    saveProfile,
  } = usePersonalAnalysisProfile();
  const [draft, setDraft] = useState<PersonalAnalysisProfile>(profile);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeout = window.setTimeout(() => clearSavedMessage(), 2800);
    return () => window.clearTimeout(timeout);
  }, [clearSavedMessage, savedMessage]);

  if (!isDrawerOpen) {
    return null;
  }

  function handleSave() {
    saveProfile(draft);
  }

  function handleReset() {
    const nextDraft = {
      ...defaultPersonalAnalysisProfile,
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextDraft);
    resetProfile();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/40"
        aria-hidden="true"
        onClick={closeDrawer}
      />
      <aside
        aria-label="Hồ sơ phân tích cá nhân"
        className="pointer-events-none fixed inset-0 z-50 flex justify-end md:inset-y-0 md:left-auto md:w-full"
        role="dialog"
        aria-modal="true"
      >
        <div className="pointer-events-auto flex h-full w-full flex-col border-l-[1.5px] border-border bg-surface shadow-soft md:max-w-[520px]">
          <header className="border-b border-border-soft bg-surface-soft px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip variant="accent">Hồ sơ</Chip>
                  <Chip variant="neutral">Cá nhân hóa hiển thị</Chip>
                </div>
                <h2 className="mt-3 font-brand text-xl font-bold text-ink">
                  Hồ sơ phân tích cá nhân
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Thiết lập cách hệ thống dẫn bạn đọc cổ phiếu, mức giải thích và thứ tự ưu tiên rủi ro.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={closeDrawer}>
                Đóng
              </Button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5">
              <ProfilePreferenceSummary profile={draft} />
              <PersonalAnalysisProfileForm draft={draft} onChange={setDraft} />
              <PersonalRoutePreview profile={draft} />
              <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs leading-5 text-muted">
                Hồ sơ này chỉ giúp hệ thống điều chỉnh cách giải thích và thứ tự ưu tiên kiểm tra.
                Nó không tạo khuyến nghị đầu tư cá nhân.
              </p>
            </div>
          </div>

          <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft bg-surface px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={handleSave}>
                Lưu hồ sơ
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Đặt lại mặc định
              </Button>
            </div>
            <Button variant="ghost" onClick={closeDrawer}>
              Đóng
            </Button>
          </footer>
        </div>
      </aside>
      {savedMessage ? (
        <div className="fixed right-4 top-16 z-[60] max-w-[320px] rounded-[4px] border-[1.5px] border-border bg-accent px-3 py-2 text-xs font-bold text-ink shadow-hard-sm">
          {savedMessage}
        </div>
      ) : null}
    </>
  );
}
