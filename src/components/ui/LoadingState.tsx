import type { ReactNode } from "react";

type LoadingStateProps = {
  title?: ReactNode;
  description?: ReactNode;
};

export function LoadingState({ description, title }: LoadingStateProps) {
  return (
    <div
      className="grid min-h-40 place-items-center rounded-[4px] border border-border bg-surface px-6 py-8 text-center shadow-soft"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        {title ? <p className="mt-4 text-sm font-semibold text-ink">{title}</p> : null}
        {description ? (
          <p className="mt-1 text-xs leading-5 text-subtle">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
