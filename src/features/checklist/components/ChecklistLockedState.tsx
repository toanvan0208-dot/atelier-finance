import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { ChecklistBlockingModule } from "../types";

type ChecklistLockedStateProps = {
  blockingModules: ChecklistBlockingModule[];
  onNavigate: (key: string) => void;
};

export function ChecklistLockedState({
  blockingModules,
  onNavigate,
}: ChecklistLockedStateProps) {
  return (
    <Card>
      <CardHeader
        icon="!"
        title="Chưa đủ điều kiện kiểm tra"
        description="Bạn cần hoàn thành đầy đủ các module phân tích trước khi làm bài kiểm tra cổ phiếu. Checklist là bước kiểm định cuối, không phải nơi thay thế quá trình phân tích."
        chip={<Chip variant="warning">Bài kiểm tra bị khóa</Chip>}
      />
      <CardBody className="space-y-4">
        <div className="rounded-[4px] border border-warning bg-warning/15 px-4 py-3">
          <p className="text-sm font-bold text-ink">Hoàn thành các module còn thiếu</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Sau khi các module đạt tối thiểu, hệ thống mới hiển thị nút bắt đầu kiểm tra.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {blockingModules.map((module) => (
            <div key={module.moduleKey} className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{module.moduleName}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{module.blockingReason}</p>
                </div>
                <Chip size="sm" variant="warning">Thiếu</Chip>
              </div>
              <div className="mt-3 space-y-2">
                {module.missingOutputs.map((output) => (
                  <p key={output} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                    {output}
                  </p>
                ))}
              </div>
              <Button className="mt-4" size="sm" onClick={() => onNavigate(module.navigateTo)}>
                Mở module này
              </Button>
            </div>
          ))}
        </div>
        <div className="pointer-events-none select-none rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4 opacity-45">
          <p className="text-sm font-bold text-ink">Preview bài kiểm tra sau khi mở khóa</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            8 nhóm câu hỏi: dữ liệu nền, vĩ mô/ngành, doanh nghiệp, BCTC, định giá, PVT, rủi ro và thesis.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
