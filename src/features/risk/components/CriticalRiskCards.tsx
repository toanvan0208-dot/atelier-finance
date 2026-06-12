"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@/components/ui";
import type { CriticalRisk } from "../types";

type CriticalRiskCardsProps = {
  risks: CriticalRisk[];
  onNavigate: (key: string) => void;
};

export function CriticalRiskCards({ onNavigate, risks }: CriticalRiskCardsProps) {
  const [openRiskId, setOpenRiskId] = useState<string | null>(risks[0]?.id ?? null);

  return (
    <Card>
      <CardHeader
        title="Rủi ro sống còn"
        description="Nếu chỉ được theo dõi 3 rủi ro, đây là những điểm có thể làm luận điểm sai mạnh nhất."
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-3">
          {risks.map((risk) => {
            const isOpen = openRiskId === risk.id;

            return (
              <div key={risk.id} className="rounded-[4px] border border-border-soft bg-surface-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <Chip size="sm" variant="warning">Ưu tiên {risk.priority}</Chip>
                </div>
                <h3 className="mt-3 text-base font-bold leading-6 text-ink">{risk.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{risk.whyItMatters}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {risk.affectedModules.map((module) => (
                    <Chip key={module} size="sm" variant="neutral">{module}</Chip>
                  ))}
                </div>
                {isOpen ? (
                  <div className="mt-4 space-y-2 border-t border-border-soft pt-3">
                    {risk.earlyWarnings.map((warning) => (
                      <p key={warning} className="rounded-[3px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                        {warning}
                      </p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setOpenRiskId(isOpen ? null : risk.id)}>
                    {isOpen ? "Thu gọn" : "Xem dấu hiệu cảnh báo"}
                  </Button>
                  {risk.targetModule ? (
                    <Button size="sm" variant="ghost" onClick={() => onNavigate(risk.targetModule ?? "risk")}>
                      Kiểm tra nguồn
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
