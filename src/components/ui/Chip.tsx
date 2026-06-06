import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipVariant = "neutral" | "accent" | "success" | "warning" | "danger";
type ChipSize = "sm" | "md";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: ChipVariant;
  size?: ChipSize;
};

const variantClasses: Record<ChipVariant, string> = {
  neutral: "border-border-soft bg-neutral text-muted",
  accent: "border-border bg-accent-soft text-ink",
  success: "border-accent-green bg-accent-green/10 text-accent-green",
  warning: "border-warning bg-warning/15 text-ink",
  danger: "border-danger bg-danger/10 text-danger",
};

const sizeClasses: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[11px]",
};

export function Chip({
  children,
  className,
  size = "md",
  variant = "neutral",
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-[3px] border font-bold leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
