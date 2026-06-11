import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

type CardHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  chip?: ReactNode;
};

type CardBodyProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  action,
  chip,
  className,
  description,
  icon,
  title,
  ...props
}: CardHeaderProps) {
  void icon;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft/70 px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-bold text-ink">{title}</h3>
          {chip}
        </div>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn("px-5 py-5", className)} {...props}>
      {children}
    </div>
  );
}
