import type { MacroTopic } from "../types";
import { cn } from "@/lib/cn";

type MacroTopicGridProps = {
  topics: MacroTopic[];
};

export function MacroTopicGrid({ topics }: MacroTopicGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <article
          key={topic.id}
          className={cn(
            "rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3",
            topic.active && "bg-accent-soft/70 shadow-hard-sm"
          )}
        >
          <h4 className="text-sm font-bold text-ink">{topic.title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted">{topic.description}</p>
        </article>
      ))}
    </div>
  );
}
