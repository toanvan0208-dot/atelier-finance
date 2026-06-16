import type { ReactNode } from "react";

type TopbarProps = {
  title: string;
  brandName: string;
  profileAction?: ReactNode;
  actions?: Array<{
    key: string;
    label: string;
    icon: string;
  }>;
};

export function Topbar({ title, brandName, profileAction }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 col-span-full grid min-h-14 grid-cols-1 border-b-[1.5px] border-border bg-surface/95 backdrop-blur md:grid-cols-[252px_minmax(0,1fr)_360px]">
      <div className="hidden items-center gap-2 border-r-[1.5px] border-border px-6 font-brand text-[13px] font-bold text-ink md:flex">
        <span
          className="relative h-4 w-4 rotate-45 rounded-[2px] border-[1.5px] border-border bg-accent after:absolute after:inset-[3px] after:rounded-[1px] after:border after:border-border"
          aria-hidden="true"
        />
        <span>{brandName}</span>
      </div>

      <div className="flex items-center justify-center px-4 text-center text-xs font-semibold text-muted">
        {title}
      </div>

      <div className="hidden items-center justify-end gap-2 border-l-[1.5px] border-border px-5 md:flex">
        {profileAction}
      </div>
    </header>
  );
}
