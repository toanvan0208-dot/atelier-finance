"use client";

import { StepAccordion } from "@/components/ui";
import { macroJourneyData } from "../data/macro.data";
import {
  MacroDisclaimer,
  MacroHeader,
  MacroInsightGrid,
  MacroInsightPanel,
  MacroSectorImpactMap,
  MacroSnapshot,
  MacroThesisBuilder,
  MacroTransmissionMap,
} from "./MacroBlocks";
import { MacroWarningDashboard } from "./MacroWarningDashboard";

type MacroPageProps = {
  onNavigate?: (moduleKey: string) => void;
};

export function MacroPage({ onNavigate }: MacroPageProps) {
  const data = macroJourneyData;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <MacroHeader overview={data.overview} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <StepAccordion
            title="Lộ trình đọc bối cảnh vĩ mô"
            description="Đi từ bức tranh hiện tại đến kênh truyền dẫn, ngành bị ảnh hưởng, tín hiệu cảnh báo và bản nhận định cá nhân."
            items={[
              {
                key: "snapshot",
                order: 1,
                title: "Macro Snapshot",
                status: "Đang đọc",
                description:
                  "Kết luận dễ hiểu về bối cảnh hiện tại, điểm hỗ trợ, điểm gây áp lực và dữ liệu chưa xác nhận.",
                meta: "Output: biết thị trường đang thuận gió, ngược gió hay trái chiều",
                content: (
                  <MacroSnapshot data={data.snapshot} onNavigate={onNavigate} />
                ),
                defaultOpen: true,
              },
              {
                key: "transmission-map",
                order: 2,
                title: "Macro Transmission Map",
                status: "Quan trọng",
                description:
                  "Bản đồ truyền dẫn từ biến vĩ mô đến ngành, BCTC, định giá và rủi ro.",
                meta: "Output: biết chỉ số vĩ mô dùng để làm gì",
                content: <MacroTransmissionMap chains={data.transmissionChains} />,
              },
              {
                key: "global-macro",
                order: 3,
                title: "Global Macro",
                status: "Cần kiểm chứng",
                description:
                  "Thế giới đang hỗ trợ hay gây áp lực cho Việt Nam qua USD, lãi suất, thương mại, hàng hóa và dòng vốn.",
                meta: "Output: biết kênh toàn cầu ảnh hưởng đến Việt Nam",
                content: (
                  <MacroInsightGrid
                    insights={data.globalInsights}
                    onNavigate={onNavigate}
                  />
                ),
              },
              {
                key: "vietnam-macro",
                order: 4,
                title: "Vietnam Macro",
                status: "Cần kiểm chứng",
                description:
                  "Kinh tế Việt Nam đang mạnh, yếu hay trái chiều ở tăng trưởng, lạm phát, tín dụng, tỷ giá và đầu tư công.",
                meta: "Output: biết yếu tố trong nước ảnh hưởng ngành nào",
                content: (
                  <MacroInsightGrid
                    insights={data.vietnamInsights}
                    onNavigate={onNavigate}
                  />
                ),
              },
              {
                key: "sector-impact-map",
                order: 5,
                title: "Sector Impact Map",
                status: "Đi sang ngành",
                description:
                  "Nhóm ngành có thể hưởng lợi, chịu áp lực, trung lập, phòng thủ, chu kỳ, nhạy chính sách hoặc chuyển pha.",
                meta: "Output: biết ngành nào cần phân tích sâu hơn",
                content: (
                  <MacroSectorImpactMap
                    groups={data.sectorImpactGroups}
                    onNavigate={onNavigate}
                  />
                ),
              },
              {
                key: "early-warning",
                order: 6,
                title: "Early Warning Dashboard",
                status: "Theo dõi",
                description:
                  "Theo dõi tín hiệu tháng, quý và tình huống căng thẳng bằng bằng chứng, ý nghĩa và hành động tiếp theo.",
                meta: "Output: biết dữ liệu nào cần chờ thêm",
                content: <MacroWarningDashboard signals={data.warningSignals} />,
              },
              {
                key: "thesis-builder",
                order: 7,
                title: "Macro Thesis Builder",
                status: "Output cuối",
                description:
                  "Viết lại nhận định vĩ mô bằng lời của bạn trước khi chuyển sang Module Ngành.",
                meta: "Output: bản nhận định vĩ mô cá nhân",
                content: (
                  <MacroThesisBuilder
                    data={data.thesisBuilder}
                    onNavigate={onNavigate}
                  />
                ),
              },
            ]}
          />

          <MacroDisclaimer
            content={data.disclaimer.content}
            title={data.disclaimer.title}
          />
        </main>

        <MacroInsightPanel data={data} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
