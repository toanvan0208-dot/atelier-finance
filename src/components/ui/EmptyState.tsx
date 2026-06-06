import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="grid min-h-40 place-items-center rounded-[4px] border border-dashed border-border bg-surface px-6 py-8 text-center shadow-soft">
      <div className="max-w-sm">
        {icon ? (
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft font-bold text-accent">
            {icon}
          </div>
        ) : null}
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-subtle">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
