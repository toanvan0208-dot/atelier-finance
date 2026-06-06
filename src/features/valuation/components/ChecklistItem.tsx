import { Chip } from "@/components/ui";

type ChecklistItemProps = {
  label: string;
  checked: boolean;
};

export function ChecklistItem({ checked, label }: ChecklistItemProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-2">
      <span className="text-sm leading-6 text-muted">{label}</span>
      <Chip variant={checked ? "success" : "warning"}>
        {checked ? "Đã có" : "Cần kiểm tra"}
      </Chip>
    </div>
  );
}
