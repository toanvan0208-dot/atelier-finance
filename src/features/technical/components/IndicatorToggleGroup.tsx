import { Chip } from "@/components/ui";
import type { PriceVolumeStoryData } from "../types";

type IndicatorToggleGroupProps = {
  items: PriceVolumeStoryData["toggles"];
};

export function IndicatorToggleGroup({ items }: IndicatorToggleGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item.key} size="sm" variant={item.enabled ? "accent" : "neutral"}>
          {item.label} {item.enabled ? "bật" : "tắt"}
        </Chip>
      ))}
    </div>
  );
}
