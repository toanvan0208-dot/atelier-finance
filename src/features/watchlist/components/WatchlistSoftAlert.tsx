import type { SoftAlert } from "../types";
import { ToneBadge } from "./WatchlistPrimitives";

type WatchlistSoftAlertProps = {
  data: SoftAlert;
};

export function WatchlistSoftAlert({ data }: WatchlistSoftAlertProps) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-3 py-3 shadow-hard-sm">
      <div className="mb-2 flex items-center gap-2">
        <ToneBadge label={data.title} tone={data.tone} />
      </div>
      <p className="text-xs leading-5 text-muted">{data.content}</p>
    </div>
  );
}
