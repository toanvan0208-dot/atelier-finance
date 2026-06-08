import type { ReactNode } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ActionItem, FieldItem, ModuleStatus, Tone, WatchlistStatus } from "../types";

type SectionCardProps = {
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
  action?: ReactNode;
};

const toneVariant: Record<Tone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

const statusVariant: Record<WatchlistStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  "Có sự kiện": "accent",
  "Cần xem lại": "warning",
  "Đang mô phỏng": "success",
  "Đang phân tích": "accent",
  "Lưu trữ": "neutral",
  "Mới thêm": "neutral",
  "Sẵn sàng mô phỏng": "success",
  "Tạm loại": "danger",
};

const moduleStatusVariant: Record<ModuleStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  "Chưa làm": "neutral",
  "Chưa sẵn sàng": "warning",
  "Có thể chuyển tiếp": "success",
  "Đang làm": "accent",
  "Đang mô phỏng": "success",
  "Đã hậu kiểm": "success",
  "Đã xong": "success",
};

export function WatchlistSectionCard({
  action,
  children,
  description,
  icon,
  title,
}: SectionCardProps) {
  return (
    <Card>
      <CardHeader
        action={action}
        description={description}
        icon={icon}
        title={title}
      />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function StatusBadge({ status }: { status: WatchlistStatus }) {
  return <Chip variant={statusVariant[status]}>{status}</Chip>;
}

export function ToneBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Chip size="sm" variant={toneVariant[tone]}>
      {label}
    </Chip>
  );
}

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Chip size="sm" variant={moduleStatusVariant[status]}>
      {status}
    </Chip>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Chip key={tag} size="sm" variant="neutral">
          {tag}
        </Chip>
      ))}
    </div>
  );
}

export function FieldGrid({ items }: { items: FieldItem[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">{item.value}</p>
            {item.tone ? <ToneBadge label={item.tone} tone={item.tone} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TextStack({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <p
          key={item}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
        >
          {item}
        </p>
      ))}
    </div>
  );
}

export function ActionButtons({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          disabled={action.disabled}
          size="sm"
          variant={action.variant}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
