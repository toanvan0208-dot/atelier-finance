import type { NavigationItem } from "@/config/navigation.config";
import { cn } from "@/lib/cn";

type SidebarProps = {
  items: NavigationItem[];
  activeKey: string;
  kicker: string;
  description: string;
  onNavigate: (key: string) => void;
};

export function Sidebar({
  items,
  activeKey,
  kicker,
  description,
  onNavigate,
}: SidebarProps) {
  const groups = ["Tổng quan", "Chuẩn bị", "Phân tích", "Thực hành & quyết định"] as const;

  return (
    <aside className="hidden border-r-[1.5px] border-border bg-shell px-4 py-6 md:block">
      <p className="mx-1 text-[10px] font-bold uppercase tracking-[0.04em] text-ink">
        {kicker}
      </p>
      <p className="mx-1 mb-5 mt-2 border-l-2 border-border pl-3 text-xs leading-snug text-muted">
        {description}
      </p>

      <nav className="grid gap-4" aria-label="Điều hướng module">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);

          return (
            <div key={group} className="grid gap-2">
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.04em] text-subtle">
                {group}
              </p>
              {groupItems.map((item) => {
                const isActive = item.key === activeKey;

                return (
                  <button
                    key={item.key}
                    data-module-key={item.key}
                    data-testid="sidebar-module-link"
                    className={cn(
                      "grid min-h-10 w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-2 rounded-[3px] border border-transparent px-2.5 text-left text-xs font-semibold text-muted transition",
                      "hover:border-border-soft hover:bg-surface-hover hover:text-ink",
                      isActive &&
                        "border-border bg-ink font-bold text-white shadow-hard-sm"
                    )}
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-[3px] border border-border-soft bg-surface text-[10px] text-muted",
                        isActive && "border-white bg-accent text-ink"
                      )}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
