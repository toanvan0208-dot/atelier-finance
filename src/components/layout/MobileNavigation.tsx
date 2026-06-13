import type { NavigationItem } from "@/config/navigation.config";
import { cn } from "@/lib/cn";

type MobileNavigationProps = {
  items: NavigationItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
};

export function MobileNavigation({
  items,
  activeKey,
  onNavigate,
}: MobileNavigationProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex gap-2 overflow-x-auto border-t-[1.5px] border-border bg-shell px-2 py-2 md:hidden"
      aria-label="Điều hướng di động"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            data-module-key={item.key}
            data-testid="mobile-module-link"
            className={cn(
              "grid min-w-[64px] gap-0.5 rounded-[3px] px-2 py-1.5 text-center text-[11px] text-subtle",
              "border border-transparent hover:border-border-soft hover:bg-surface-hover hover:text-ink",
              isActive && "border-border bg-ink font-bold text-white shadow-hard-sm"
            )}
            type="button"
            onClick={() => onNavigate(item.key)}
            aria-current={isActive ? "page" : undefined}
          >
            <strong className={cn("text-[12px] font-semibold", isActive && "text-white")}>
              {item.icon}
            </strong>
            <span>{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
