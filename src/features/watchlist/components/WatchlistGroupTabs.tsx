"use client";

import { Tabs } from "@/components/ui";
import type { WatchlistGroup } from "../types";

type WatchlistGroupTabsProps = {
  data: WatchlistGroup[];
};

export function WatchlistGroupTabs({ data }: WatchlistGroupTabsProps) {
  return (
    <Tabs
      ariaLabel="Nhóm Watchlist"
      items={data.map((group) => ({
        value: group.id,
        label: `${group.label} (${group.count})`,
        content: (
          <p className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs leading-5 text-muted">
            {group.description}
          </p>
        ),
      }))}
    />
  );
}
