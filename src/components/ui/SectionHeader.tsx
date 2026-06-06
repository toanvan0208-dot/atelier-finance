import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
};

export function SectionHeader({
  action,
  description,
  eyebrow,
  icon,
  title,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-subtle">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
              {icon}
            </span>
          ) : null}
          <h2 className="truncate font-brand text-base font-bold text-ink">{title}</h2>
        </div>
        {description ? (
          <p className="mt-1 max-w-[68ch] text-xs leading-5 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
