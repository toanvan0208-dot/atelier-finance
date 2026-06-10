import { Button, Chip, SectionHeader } from "@/components/ui";
import type { BusinessNextActionsData } from "../types";

type BusinessNextActionsProps = {
  canGoToFinancials: boolean;
  data: BusinessNextActionsData;
};

export function BusinessNextActions({
  canGoToFinancials,
  data,
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

          return (
            <Button
              key={action.label}
              disabled={disabled}
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
