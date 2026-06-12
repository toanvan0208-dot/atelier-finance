import { Button, Chip, SectionHeader } from "@/components/ui";
import type { BusinessNextActionsData } from "../types";

type BusinessNextActionsProps = {
  canGoToFinancials: boolean;
  data: BusinessNextActionsData;
  onNavigate?: (moduleKey: string) => void;
};

export function BusinessNextActions({
  canGoToFinancials,
  data,
  onNavigate,
}: BusinessNextActionsProps) {
  return (
    <section>
      <SectionHeader
        action={
          <Chip variant={canGoToFinancials ? "success" : "warning"}>
            {canGoToFinancials ? "Đủ điều kiện" : "Chưa đủ dữ kiện"}
          </Chip>
        }
        description={data.description}
        icon={data.icon}
        title={data.title}
      />
      <div className="flex flex-wrap gap-2">
        {data.actions.map((action) => {
          const disabled = action.label.includes("BCTC") && !canGoToFinancials;
          const targetModule = action.label.includes("BCTC")
            ? "financials"
            : action.label.includes("Watchlist")
              ? "watchlist"
              : action.label.includes("Lá»c") || action.label.includes("Lọc")
                ? "screening"
                : undefined;

          return (
            <Button
              key={action.label}
              disabled={disabled}
              onClick={() => {
                if (targetModule) onNavigate?.(targetModule);
              }}
              size="sm"
              variant={disabled ? "secondary" : action.variant}
            >
              {disabled ? "Hoàn thành mini check" : action.label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
