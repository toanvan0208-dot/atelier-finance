import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type InsightCardProps = {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  tone?: "accent" | "neutral" | "warning";
};

const toneClasses = {
  accent: "border-border bg-accent-soft/70",
  neutral: "border-border-soft bg-surface",
  warning: "border-border bg-warning/15",
};

export function InsightCard({
  description,
  eyebrow,
  title,
  tone = "accent",
}: InsightCardProps) {
  return (
    <section className={cn("rounded-[4px] border-[1.5px] px-4 py-4 shadow-hard", toneClasses[tone])}>
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 font-brand text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </section>
  );
}
