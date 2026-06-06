import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[1.5px] border-border bg-accent text-ink shadow-hard-sm hover:-translate-y-0.5 hover:bg-[#DCA900] disabled:bg-neutral disabled:text-subtle",
  secondary:
    "border-[1.5px] border-border bg-surface text-ink shadow-hard-sm hover:-translate-y-0.5 hover:bg-surface-hover disabled:text-subtle",
  ghost:
    "border border-transparent text-muted hover:border-border-soft hover:bg-surface-hover hover:text-ink disabled:text-subtle",
  danger:
    "border-[1.5px] border-border bg-danger text-white shadow-hard-sm hover:-translate-y-0.5 disabled:text-white/60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-10 gap-2.5 px-4 text-sm",
  icon: "h-9 w-9 p-0 text-sm",
};

export function Button({
  children,
  className,
  disabled,
  isLoading,
  leftIcon,
  rightIcon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[3px] font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {size !== "icon" ? children : <span className="sr-only">{children}</span>}
      {!isLoading ? rightIcon : null}
    </button>
  );
}
