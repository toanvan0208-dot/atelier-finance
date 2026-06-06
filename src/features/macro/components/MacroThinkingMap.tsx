import type { MacroMapNode } from "../types";
import { cn } from "@/lib/cn";

type MacroThinkingMapProps = {
  nodes: MacroMapNode[];
};

const positionClasses: Record<MacroMapNode["position"], string> = {
  center:
    "border-accent-soft bg-accent-soft shadow-hard-sm sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
  left: "sm:left-5 sm:top-1/2 sm:-translate-y-1/2",
  top: "sm:left-1/2 sm:top-5 sm:-translate-x-1/2",
  right: "sm:right-5 sm:top-1/2 sm:-translate-y-1/2",
};

export function MacroThinkingMap({ nodes }: MacroThinkingMapProps) {
  return (
    <div
      className="relative grid gap-3 overflow-hidden rounded-[4px] border-[1.5px] border-border bg-surface p-3 shadow-soft sm:block sm:min-h-[260px] sm:p-0"
      aria-label="Bản đồ nhận định vĩ mô"
    >
      <div
        className="absolute inset-0 hidden opacity-[0.45] sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(52,80,100,0.12) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />
      <div className="absolute left-[18%] right-[18%] top-1/2 hidden h-px bg-border-soft sm:block" />
      <div className="absolute bottom-[22%] left-1/2 top-[22%] hidden w-px bg-border-soft sm:block" />

      {nodes.map((node) => (
        <div
          key={node.id}
          className={cn(
            "z-10 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-center sm:absolute sm:w-[132px]",
            positionClasses[node.position]
          )}
        >
          <strong className="block text-xs font-semibold text-ink">{node.title}</strong>
          <span className="mt-1 block text-[11px] leading-4 text-subtle">
            {node.description}
          </span>
        </div>
      ))}
    </div>
  );
}
