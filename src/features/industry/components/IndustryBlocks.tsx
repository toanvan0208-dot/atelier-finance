import { useState, type ReactNode } from "react";
import { AnalysisNotePopover } from "@/components/common/AnalysisNotePopover";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DataTable,
  SectionHeader,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import type {
  FieldItem,
  IndustryAction,
  IndustryBlockData,
  IndustryHeaderData,
  IndustryInsightPanelData,
  IndustryJourneyData,
  IndustryOption,
  IndustryQuickOverviewData,
  IndustryTableRow,
  IndustryTutorData,
  Tone,
} from "../types";

const toneVariant: Record<Tone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

function ActionButtons({ actions }: { actions: IndustryAction[] }) {
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

function StatusChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <Chip size="sm" variant={toneVariant[tone]}>
      {label}
    </Chip>
  );
}

function industrySignal(option: IndustryOption): { label: string; tone: Tone } {
  const text = `${option.name} ${option.industryType} ${option.description}`.toLowerCase();

  if (text.includes("phòng thủ") || text.includes("tiện ích")) {
    return { label: "Phòng thủ", tone: "success" };
  }

  if (
    text.includes("chu kỳ") ||
    text.includes("hàng hóa") ||
    text.includes("bất động sản") ||
    text.includes("xuất khẩu")
  ) {
    return { label: "Chu kỳ", tone: "warning" };
  }

  if (text.includes("tài chính") || text.includes("lãi suất") || text.includes("tín dụng")) {
    return { label: "Nhạy vĩ mô", tone: "accent" };
  }

  if (text.includes("tăng trưởng") || text.includes("công nghệ")) {
    return { label: "Tăng trưởng", tone: "accent" };
  }

  return { label: "Theo dõi", tone: "neutral" };
}

function industryThesisSignal(option: IndustryOption): { label: string; tone: Tone } {
  const answer = option.quickAnswers[3]?.answer.toLowerCase() ?? "";

  if (answer.includes("hưởng lợi")) {
    return { label: "Hưởng lợi có điều kiện", tone: "success" };
  }

  if (answer.includes("bất lợi")) {
    return { label: "Bất lợi", tone: "danger" };
  }

  if (answer.includes("trung lập")) {
    return { label: "Trung lập", tone: "neutral" };
  }

  return { label: "Chưa đủ dữ liệu", tone: "warning" };
}

function FieldGrid({ items = [] }: { items?: FieldItem[] }) {
  if (items.length === 0) {
    return null;
  }

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
            {item.tone ? <StatusChip label={item.tone} tone={item.tone} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextList({ items = [] }: { items?: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
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

function IndustrySectionCard({
  action,
  children,
  description,
  icon,
  title,
}: {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
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

export function IndustrySelector({
  options,
  selectedId,
  onSelect,
}: {
  options: IndustryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const visibleOptions = showAll
    ? options
    : [
        selected,
        ...options.filter((option) => option.id !== selected.id).slice(0, 3),
      ];
  const hiddenCount = Math.max(options.length - visibleOptions.length, 0);

  return (
    <section className="parent-surface-card rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chip variant="accent">Chọn ngành</Chip>
            <StatusChip {...industrySignal(selected)} />
            <StatusChip {...industryThesisSignal(selected)} />
          </div>
          <h2 className="text-xl font-bold leading-tight text-ink">Bạn muốn phân tích ngành nào?</h2>
          <p className="mt-2 max-w-[720px] text-sm leading-6 text-muted">
            Chọn nhanh một ngành để đổi bối cảnh phân tích. Danh sách đầy đủ được thu gọn để không chiếm quá nhiều diện tích màn hình.
          </p>
        </div>
        <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
          <p className="text-[11px] font-semibold text-subtle">Ngành đang chọn</p>
          <p className="mt-1 text-sm font-bold text-ink">{selected.name}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{selected.industryType}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip {...industrySignal(selected)} />
            <StatusChip {...industryThesisSignal(selected)} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleOptions.map((option) => {
          const isSelected = option.id === selectedId;
          const typeSignal = industrySignal(option);
          const thesisSignal = industryThesisSignal(option);

          return (
            <button
              key={option.id}
              className={[
                "grid min-h-[128px] content-between rounded-[4px] border-[1.5px] px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5",
                isSelected
                  ? "border-border bg-ink text-white"
                  : "border-border bg-surface-soft text-ink hover:bg-surface-hover",
              ].join(" ")}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
            >
              <span>
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className={isSelected ? "text-sm font-bold text-white" : "text-sm font-bold text-ink"}>
                    {option.name}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    <StatusChip label={typeSignal.label} tone={typeSignal.tone} />
                    <StatusChip label={thesisSignal.label} tone={thesisSignal.tone} />
                  </span>
                </span>
                <span className={isSelected ? "mt-1 block text-xs leading-5 text-white/75" : "mt-1 block text-xs leading-5 text-muted"}>
                  {option.description}
                </span>
              </span>
              <span className={isSelected ? "mt-3 text-[11px] font-bold text-accent" : "mt-3 text-[11px] font-bold text-subtle"}>
                {option.keyQuestions[0]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
        <p className="text-xs leading-5 text-muted">
          {showAll
            ? `Đang hiển thị ${options.length} ngành.`
            : `Đang hiển thị ${visibleOptions.length} ngành, còn ${hiddenCount} ngành đang thu gọn.`}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Thu gọn" : "Xem tất cả"}
        </Button>
      </div>
    </section>
  );
}

export function IndustryHeader({ data }: { data: IndustryHeaderData }) {
  return (
    <section className="parent-surface-card rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip variant="accent">{data.moduleName}</Chip>
            <Chip variant="neutral">{data.status}</Chip>
          </div>
          <h2 className="text-2xl font-bold leading-tight text-ink">{data.subtitle}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] font-semibold text-subtle">Ngành đang phân tích</p>
              <p className="text-sm font-bold text-ink">{data.industryName}</p>
            </div>
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2">
              <p className="text-[11px] font-semibold text-subtle">Loại hình ngành</p>
              <p className="text-sm font-bold text-ink">{data.industryType}</p>
            </div>
          </div>
        </div>
        <ActionButtons actions={data.actions} />
      </div>
    </section>
  );
}

export function IndustryQuickOverview({ data }: { data: IndustryQuickOverviewData }) {
  return (
    <div className="space-y-4">
      <SectionHeader description={data.description} icon={data.icon} title={data.title} />
      <Card>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2">
            {data.answers.map((answer) => (
              <div
                key={answer.question}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{answer.question}</p>
                  <StatusChip label={answer.status} tone={answer.tone} />
                </div>
                <p className="text-sm leading-6 text-muted">{answer.answer}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

const industryClusters = [
  {
    id: "identify",
    title: "Nhận diện ngành",
    question: "Ngành này là kiểu ngành gì và nằm ở đâu trong nền kinh tế?",
    range: [1, 2],
    output: "Xác định loại ngành, vai trò kinh tế và những biến lớn cần để ý.",
  },
  {
    id: "money",
    title: "Hiểu cách ngành tạo tiền",
    question: "Ngành kiếm tiền từ biến vận hành nào và tiền nằm ở khâu nào?",
    range: [3, 5],
    output: "Nhìn được profit pool, chuỗi giá trị và quyền mặc cả trong ngành.",
  },
  {
    id: "macro",
    title: "Nối ngành với vĩ mô và chính sách",
    question: "Vĩ mô đang kéo, đè hay làm ngành chuyển pha?",
    range: [6, 8],
    output: "Có giả thuyết ngành đang hưởng lợi, bất lợi, trung lập hay chuyển pha.",
  },
  {
    id: "data",
    title: "Đọc dữ liệu, chu kỳ và cạnh tranh",
    question: "Dữ liệu nào xác nhận cầu, cung, chu kỳ và sức cạnh tranh?",
    range: [9, 15],
    output: "Lập bộ dữ liệu cần theo dõi và tránh đọc sai một tín hiệu đơn lẻ.",
  },
  {
    id: "bridge",
    title: "Kết luận ngành và nối sang cổ phiếu",
    question: "Ngành tốt đến đâu và doanh nghiệp nào đáng phân tích tiếp?",
    range: [16, 17],
    output: "Kết luận có điều kiện trước khi chuyển sang lọc cổ phiếu hoặc BCTC.",
  },
];

const thesisNodes = [
  {
    title: "Vĩ mô",
    description: "Lãi suất, tín dụng, FDI, tỷ giá, hàng hóa hoặc chính sách tạo lực kéo/đè.",
  },
  {
    title: "Cầu/Cung",
    description: "Lực vĩ mô phải đi vào đơn hàng, sản lượng, công suất hoặc tồn kho.",
  },
  {
    title: "Biên lợi nhuận",
    description: "Giá bán và chi phí đầu vào quyết định ngành có thật sự kiếm được tiền không.",
  },
  {
    title: "BCTC",
    description: "Dữ liệu ngành phải hiện lên ở doanh thu, biên gộp, tồn kho, nợ vay hoặc dòng tiền.",
  },
  {
    title: "Cổ phiếu ứng viên",
    description: "Chỉ chọn doanh nghiệp có lợi thế cụ thể để phân tích sâu hơn.",
  },
];

const dataBoardColumns = [
  {
    title: "Dữ liệu dẫn dắt",
    items: ["Lãi suất/tín dụng", "Giá hàng hóa đầu vào", "Đơn hàng, FDI hoặc đầu tư công"],
  },
  {
    title: "Dữ liệu xác nhận",
    items: ["Sản lượng tiêu thụ", "Biên lợi nhuận gộp", "Doanh thu và dòng tiền trong BCTC"],
  },
  {
    title: "Dữ liệu cảnh báo",
    items: ["Tồn kho tăng nhanh", "Cung mới mở rộng quá mạnh", "Chính sách hoặc cạnh tranh làm đổi giả thuyết"],
  },
];

function stepOutput(block: IndustryBlockData) {
  return block.outputPrompts?.[0] ?? block.details?.[0] ?? block.easyExplanation;
}

function currentClusterForStep(stepNumber: number) {
  return industryClusters.find(
    (cluster) => stepNumber >= cluster.range[0] && stepNumber <= cluster.range[1]
  );
}

function clusterBlocksForRange(blocks: IndustryBlockData[], range: number[]) {
  return blocks.filter(
    (block) => block.stepNumber >= range[0] && block.stepNumber <= range[1]
  );
}

function clusterResultBullets(cluster: (typeof industryClusters)[number], blocks: IndustryBlockData[]) {
  const prompts = blocks.flatMap((block) => block.outputPrompts ?? []);

  if (prompts.length > 0) {
    return prompts.slice(0, 4);
  }

  return [
    cluster.output,
    "Biết dữ liệu nào cần theo dõi tiếp.",
    "Biết module nào cần dùng để kiểm chứng.",
  ];
}

function clusterStatusLabel({
  activeClusterIndex,
  index,
  isSelected,
}: {
  activeClusterIndex: number;
  index: number;
  isSelected: boolean;
}) {
  if (isSelected) {
    return "Đang chọn";
  }

  if (index < activeClusterIndex) {
    return "Đã xong";
  }

  if (index === activeClusterIndex) {
    return "Đang làm";
  }

  return "Chưa mở";
}

export function IndustryThesisHeader({
  selectedIndustry,
}: {
  selectedIndustry: IndustryOption;
}) {
  return (
    <section className="parent-surface-card rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="max-w-[860px]">
        <div className="mb-2">
          <AnalysisNotePopover
            contextTitle={selectedIndustry.name}
            moduleId="industry"
            moduleName="Ngành"
            noteType="assumption"
          />
        </div>
        <Chip variant="accent">Phân tích ngành</Chip>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink md:text-3xl">
          Xây luận điểm ngành trước khi chọn cổ phiếu
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Hiểu trạng thái ngành, lực vĩ mô đang hỗ trợ hoặc gây áp lực, bộ dữ liệu cần theo dõi và nhóm doanh nghiệp đáng phân tích tiếp. Đây không phải là tín hiệu hành động giao dịch.
        </p>
        <div className="mt-4 rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">
            Ngành thuận lợi chưa chắc doanh nghiệp phù hợp. Bạn vẫn cần kiểm tra mô hình kinh doanh, BCTC, định giá và rủi ro của từng doanh nghiệp.
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Đang phân tích: <span className="font-bold text-ink">{selectedIndustry.name}</span> - {selectedIndustry.industryType}
          </p>
        </div>
      </div>
    </section>
  );
}

export function IndustryQuickSnapshot({
  selectedIndustry,
}: {
  selectedIndustry: IndustryOption;
}) {
  const answers = selectedIndustry.quickAnswers;
  const cards = [
    {
      title: "Kiểu ngành",
      value: selectedIndustry.industryType,
      note: selectedIndustry.description,
    },
    {
      title: "Biến vĩ mô chính",
      value: answers[2]?.answer ?? selectedIndustry.keyQuestions[0],
      note: "Dùng để kiểm tra ngành đang được kéo lên hay bị đè xuống.",
    },
    {
      title: "Trạng thái sơ bộ",
      value: answers[3]?.answer ?? selectedIndustry.status,
      note: "Chưa chốt luận điểm nếu thiếu dữ liệu xác nhận.",
    },
    {
      title: "Dữ liệu đầu tiên cần xem",
      value: answers[4]?.answer ?? selectedIndustry.keyQuestions.join(", "),
      note: "Ưu tiên dữ liệu có thể nối được sang BCTC doanh nghiệp.",
    },
  ];

  return (
    <section className="space-y-4">
      <SectionHeader
        description="Tóm tắt nhanh trước khi đi vào 5 cụm phân tích."
        icon="QS"
        title="Bức tranh nhanh của ngành"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardBody>
              <p className="text-[11px] font-bold uppercase text-subtle">{card.title}</p>
              <p className="mt-2 text-sm font-bold leading-5 text-ink">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{card.note}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function IndustryThesisMap() {
  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Một ngành chỉ đáng phân tích tiếp khi câu chuyện vĩ mô đi được đến dữ liệu doanh nghiệp."
        icon="TM"
        title="Bản đồ luận điểm ngành"
      />
      <CardBody className="bg-surface-soft/45">
        <div className="grid gap-3 lg:grid-cols-5">
          {thesisNodes.map((node, index) => (
            <div
              key={node.title}
              className="relative rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="font-mono text-[11px] font-bold text-subtle">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-bold text-ink">{node.title}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{node.description}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function IndustryJourneyBuilder({
  activeStepId,
  blocks,
  onSelectStep,
}: {
  blocks: IndustryBlockData[];
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
}) {
  const activeBlock = blocks.find((block) => block.id === activeStepId) ?? blocks[0];
  const activeCluster =
    currentClusterForStep(activeBlock?.stepNumber ?? industryClusters[0].range[0]) ??
    industryClusters[0];
  const activeClusterIndex = Math.max(
    industryClusters.findIndex((cluster) => cluster.id === activeCluster.id),
    0
  );
  const [selectedClusterId, setSelectedClusterId] = useState(activeCluster.id);
  const [showGuide, setShowGuide] = useState(false);
  const selectedCluster =
    industryClusters.find((cluster) => cluster.id === selectedClusterId) ??
    activeCluster;
  const selectedClusterIndex = Math.max(
    industryClusters.findIndex((cluster) => cluster.id === selectedCluster.id),
    0
  );
  const selectedBlocks = clusterBlocksForRange(blocks, selectedCluster.range);
  const resultBullets = clusterResultBullets(selectedCluster, selectedBlocks);
  const nextCluster = industryClusters[selectedClusterIndex + 1];

  return (
    <Card className="parent-surface-card border-border-soft">
      <CardBody className="space-y-6 bg-surface-soft/45">
        <div className="flex flex-col gap-4 border-b border-border-soft pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[760px]">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip variant="accent">Lộ trình</Chip>
              <Chip variant="neutral">Đang ở: {activeCluster.title}</Chip>
            </div>
            <h2 className="text-xl font-bold leading-tight text-ink">
              Lộ trình 5 cụm phân tích ngành
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Đi từ nhận diện ngành, hiểu cách ngành tạo tiền, nối với vĩ mô, đọc dữ liệu, đến kết luận ngành trước khi chọn cổ phiếu.
            </p>
            <p className="mt-2 text-xs font-semibold text-subtle">
              Cụm {activeClusterIndex + 1}/5 đang làm
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowGuide(true)}>
            Cách đọc lộ trình
          </Button>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[980px] grid-cols-5 items-stretch gap-3">
            {industryClusters.map((cluster, index) => {
              const clusterBlocks = clusterBlocksForRange(blocks, cluster.range);
              const isSelected = cluster.id === selectedCluster.id;
              const status = clusterStatusLabel({
                activeClusterIndex,
                index,
                isSelected,
              });

              return (
                <div key={cluster.id} className="relative">
                  {index < industryClusters.length - 1 ? (
                    <span className="absolute left-[calc(100%-2px)] top-6 hidden h-px w-5 bg-border-soft lg:block" />
                  ) : null}
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedClusterId(cluster.id)}
                    className={[
                      "h-full w-full rounded-[4px] px-3 py-3 text-left transition",
                      isSelected
                        ? "border-[1.5px] border-border bg-surface shadow-soft"
                        : "border border-border-soft bg-surface/65 hover:bg-surface",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={[
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                          isSelected
                            ? "border-border bg-ink text-white"
                            : "border-border-soft bg-surface-soft text-ink",
                        ].join(" ")}
                      >
                        {index + 1}
                      </span>
                      <Chip size="sm" variant={isSelected ? "accent" : "neutral"}>
                        {status}
                      </Chip>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-5 text-ink">{cluster.title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-subtle">
                      {clusterBlocks.length} bước
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                      Output: {cluster.output}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <section className="rounded-[4px] border border-border-soft bg-surface px-4 py-4 shadow-soft">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip variant="accent">Cụm {selectedClusterIndex + 1}</Chip>
                <Chip variant="neutral">{selectedBlocks.length} bước</Chip>
                {nextCluster ? <Chip variant="neutral">Tiếp theo: {nextCluster.title}</Chip> : null}
              </div>
              <h3 className="mt-3 text-lg font-bold leading-tight text-ink">
                {selectedCluster.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                <span className="font-bold text-ink">Câu hỏi lớn: </span>
                {selectedCluster.question}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                <span className="font-bold text-ink">Mục tiêu: </span>
                Xác định đúng vai trò của cụm này trước khi đi sang dữ liệu chi tiết hoặc chọn cổ phiếu.
              </p>
            </div>

            <div className="rounded-[4px] border border-accent bg-accent-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">
                Sau cụm này, bạn cần trả lời được:
              </p>
              <div className="mt-3 space-y-2">
                {resultBullets.map((item) => (
                  <p key={item} className="text-xs leading-5 text-muted">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {selectedBlocks.map((block) => {
              const isActive = block.id === activeStepId;

              return (
                <article
                  key={block.id}
                  className={[
                    "rounded-[4px] px-3 py-3 transition",
                    isActive
                      ? "border-[1.5px] border-border bg-surface-soft shadow-hard-sm"
                      : "border border-border-soft bg-surface",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold text-subtle">
                        Bước {block.stepNumber}
                      </p>
                      <h4 className="mt-1 text-sm font-bold leading-5 text-ink">{block.title}</h4>
                    </div>
                    <Chip size="sm" variant={isActive ? "accent" : "neutral"}>
                      {isActive ? "Đang làm" : "Chưa mở"}
                    </Chip>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    <span className="font-bold text-ink">Câu hỏi: </span>
                    {block.centralQuestion}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    <span className="font-bold text-ink">Output: </span>
                    {stepOutput(block)}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-subtle">
                    Module liên quan: {block.moduleLinks.join(", ")}
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant={isActive ? "primary" : "secondary"} onClick={() => onSelectStep(block.id)}>
                      {isActive ? "Xem chi tiết" : "Làm bước này"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {showGuide ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
            role="dialog"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="max-h-[92dvh] w-full max-w-[760px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
                <div>
                  <Chip variant="accent">Hướng dẫn</Chip>
                  <h3 className="mt-2 text-lg font-bold text-ink">Cách đọc lộ trình ngành</h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowGuide(false)}>
                  Đóng
                </Button>
              </div>
              <div className="max-h-[calc(92dvh-104px)] overflow-y-auto px-4 py-4 sm:px-5">
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    "Lộ trình giúp bạn hiểu ngành trước khi chọn cổ phiếu, không phải checklist cần đọc hết một lượt.",
                    "Mỗi cụm trả lời một câu hỏi lớn và tạo một output đủ ngắn để kiểm chứng tiếp.",
                    "Ngành thuận lợi chưa chắc doanh nghiệp phù hợp vì doanh nghiệp, BCTC, Định giá và rủi ro có thể khác nhau.",
                    "Sau module Ngành, cần nối sang BCTC, Định giá và Rủi ro trước khi kết luận.",
                  ].map((item) => (
                    <p
                      key={item}
                      className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3 text-xs leading-5 text-muted"
                    >
                      {item}
                    </p>
                  ))}
                </div>
                <div className="mt-4 rounded-[4px] border border-accent bg-accent-soft px-3 py-3">
                  <p className="text-xs font-bold text-ink">Cách dùng nhanh</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Chọn một cụm ở stepper, đọc câu hỏi lớn, làm từng bước con, mở chi tiết khi cần giải thích sâu, rồi dùng output cuối cụm để quyết định có chuyển sang cụm tiếp theo chưa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function IndustryStepDetailModal({
  block,
  onClose,
}: {
  block: IndustryBlockData;
  onClose: () => void;
}) {
  const cluster = currentClusterForStep(block.stepNumber);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[920px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip variant="accent">Bước {block.stepNumber}/17</Chip>
              {cluster ? <Chip variant="neutral">{cluster.title}</Chip> : null}
            </div>
            <h2 className="text-lg font-bold leading-tight text-ink">{block.title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{block.centralQuestion}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>

        <div className="max-h-[calc(92dvh-112px)] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3">
                <p className="text-xs font-bold text-ink">Câu hỏi chính</p>
                <p className="mt-1 text-sm font-bold leading-6 text-ink">{block.centralQuestion}</p>
              </div>
              <div className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
                <p className="text-xs font-bold text-ink">Giải thích đơn giản</p>
                <p className="mt-1 text-sm leading-6 text-muted">{block.easyExplanation}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Vì sao quan trọng</p>
                <TextList items={(block.details ?? block.outputPrompts ?? []).slice(0, 3)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold text-ink">Câu trả lời mẫu</p>
                  <TextList items={[stepOutput(block)]} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-ink">Output cần có</p>
                  <TextList items={(block.outputPrompts ?? [stepOutput(block)]).slice(0, 3)} />
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Dữ liệu cần kiểm tra</p>
                <TextList items={block.dataToWatch.slice(0, 5)} />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Lỗi người mới hay gặp</p>
                <TextList items={block.pitfalls.slice(0, 3)} />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Module liên quan</p>
                <TextList items={block.moduleLinks} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IndustryDataBoard({
  selectedIndustry,
}: {
  selectedIndustry: IndustryOption;
}) {
  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description={`Bộ dữ liệu này thay đổi theo ngành đang chọn: ${selectedIndustry.name}.`}
        icon="DB"
        title="Bộ dữ liệu ngành cần theo dõi"
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-3">
          {dataBoardColumns.map((column) => (
            <div
              key={column.title}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="text-sm font-bold text-ink">{column.title}</p>
              <div className="mt-3 space-y-2">
                {column.items.map((item) => (
                  <p
                    key={item}
                    className="rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function IndustryConclusionBuilder({
  selectedIndustry,
}: {
  selectedIndustry: IndustryOption;
}) {
  const [openGuide, setOpenGuide] = useState<"conclusion" | "thesis" | null>(null);
  const reasons = selectedIndustry.keyQuestions.slice(0, 3).map((question, index) => ({
    title: index === 0 ? "Biến dẫn dắt chính" : index === 1 ? "Dữ liệu cần xác nhận" : "Điều kiện chuyển tiếp",
    description: question,
  }));
  const risks = [
    {
      title: "Biên lợi nhuận không xác nhận",
      description: "Giá đầu vào tăng nhanh hơn giá bán hoặc sản lượng không cải thiện.",
    },
    {
      title: "Câu chuyện chưa vào BCTC",
      description: "Doanh thu, tồn kho hoặc dòng tiền chưa phản ánh kỳ vọng ngành.",
    },
    {
      title: "Kỳ vọng đã đi trước",
      description: "Định giá hoặc giá cổ phiếu đã phản ánh quá nhiều tin tốt.",
    },
  ];
  const referenceStatuses = ["Bất lợi", "Trung lập", "Chuyển pha", "Chưa đủ dữ liệu"];

  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Chốt trạng thái ngành theo điều kiện rõ ràng trước khi chuyển sang doanh nghiệp, BCTC, định giá và rủi ro."
        icon="KL"
        title="Kết luận ngành có điều kiện"
      />
      <CardBody className="space-y-5">
        <section className="rounded-[4px] border border-accent bg-accent-soft px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[760px]">
              <p className="text-xs font-bold text-ink">Trạng thái ngành hiện tại</p>
              <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">
                Hưởng lợi có điều kiện
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ngành có tín hiệu hỗ trợ, nhưng cần xác nhận bằng sản lượng, biên lợi nhuận và dòng tiền.
              </p>
              <p className="mt-2 text-[11px] font-semibold text-subtle">
                Đây là kết luận ngành có điều kiện, không phải tín hiệu hành động giao dịch.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-[320px] lg:justify-end">
              <Chip variant="accent">Gợi ý hiện tại</Chip>
              {referenceStatuses.map((status) => (
                <Chip key={status} size="sm" variant="neutral">
                  {status}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">Vì sao có kết luận này?</p>
                <p className="mt-1 text-xs leading-5 text-muted">Ba lý do cần được kiểm chứng bằng dữ liệu ngành và BCTC.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setOpenGuide("conclusion")}>
                Cách hiểu
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {reasons.map((reason) => (
                <div key={reason.title} className="rounded-[4px] bg-surface px-3 py-3">
                  <p className="text-xs font-bold text-ink">{reason.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{reason.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
            <p className="text-sm font-bold text-ink">Điều gì có thể làm kết luận sai?</p>
            <p className="mt-1 text-xs leading-5 text-muted">Nếu các điều kiện này xuất hiện, cần hạ mức tin cậy của thesis.</p>
            <div className="mt-4 space-y-3">
              {risks.map((risk) => (
                <div key={risk.title} className="rounded-[4px] bg-surface px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink">{risk.title}</p>
                    <Chip size="sm" variant="warning">Theo dõi</Chip>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{risk.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[4px] border border-border-soft bg-surface px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[820px]">
              <p className="text-sm font-bold text-ink">Thesis ngành hiện tại</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {selectedIndustry.name} đang ở trạng thái hưởng lợi có điều kiện. Luận điểm chỉ mạnh hơn nếu dữ liệu ngành, biên lợi nhuận và dòng tiền doanh nghiệp xác nhận phục hồi. Nếu chi phí đầu vào tăng nhanh hoặc nhu cầu yếu, thesis cần được hạ mức tin cậy.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setOpenGuide("thesis")}>
              Xem cách viết thesis
            </Button>
          </div>
        </section>

        <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <p className="text-sm font-bold text-ink">Bước ưu tiên tiếp theo</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Ưu tiên: lọc cổ phiếu trong ngành, nhưng chỉ sau khi đã hiểu ngành kiếm tiền bằng cách nào và rủi ro chính là gì.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button size="sm" variant="primary">Lọc cổ phiếu</Button>
            <div className="flex flex-wrap gap-2">
              {["Hiểu doanh nghiệp", "BCTC", "Định giá", "Watchlist"].map((action) => (
                <Button key={action} size="sm" variant="secondary">
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </CardBody>

      {openGuide ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-3 py-3 sm:items-center sm:px-5"
          role="dialog"
          onClick={() => setOpenGuide(null)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-[720px] overflow-hidden rounded-[6px] border-[1.5px] border-border bg-surface shadow-hard"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-soft bg-surface-soft px-4 py-4 sm:px-5">
              <div>
                <Chip variant="accent">Hướng dẫn</Chip>
                <h3 className="mt-2 text-lg font-bold text-ink">
                  {openGuide === "conclusion" ? "Cách hiểu kết luận ngành" : "Cách viết thesis ngành"}
                </h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setOpenGuide(null)}>
                Đóng
              </Button>
            </div>
            <div className="max-h-[calc(92dvh-104px)] overflow-y-auto px-4 py-4 sm:px-5">
              <TextList
                items={
                  openGuide === "conclusion"
                    ? [
                        "Trạng thái ngành là nhận định có điều kiện, không phải tín hiệu hành động với cổ phiếu.",
                        "Kết luận cần đi kèm lý do, dữ liệu xác nhận và rủi ro có thể làm thesis sai.",
                        "Hạ mức tin cậy khi dữ liệu ngành không đi vào sản lượng, biên lợi nhuận hoặc BCTC.",
                      ]
                    : [
                        "Thesis ngành tốt cần có trạng thái, lý do, điều kiện xác nhận và điều kiện sai.",
                        "Thesis sai thường chỉ kể câu chuyện hấp dẫn nhưng không chỉ ra dữ liệu kiểm chứng.",
                        "Trước khi chọn cổ phiếu, cần nối thesis sang doanh nghiệp, BCTC, định giá và rủi ro.",
                      ]
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function IndustryToStockBridge() {
  const groups = [
    {
      title: "Đáng phân tích tiếp",
      description: "Ngành có câu chuyện hợp lý và dữ liệu ban đầu đủ để chuyển sang tìm doanh nghiệp cụ thể.",
      items: ["Có lợi thế rõ trong ngành", "BCTC có thể xác nhận bằng biên lợi nhuận hoặc dòng tiền", "Rủi ro chính có thể theo dõi được"],
      action: "Phân tích tiếp",
      highlighted: true,
    },
    {
      title: "Cần theo dõi thêm",
      description: "Câu chuyện ngành có thể đúng, nhưng dữ liệu xác nhận còn thiếu hoặc kỳ vọng đã phản ánh nhiều.",
      items: ["Dữ liệu ngành chưa đủ rõ", "Định giá đã phản ánh nhiều kỳ vọng", "Còn biến số rủi ro chưa rõ"],
      action: "Theo dõi thêm",
      highlighted: false,
    },
    {
      title: "Chưa phù hợp với người mới",
      description: "Ngành có quá nhiều biến số khó kiểm chứng, dễ khiến người mới hiểu sai rủi ro.",
      items: ["Mô hình ngành quá phức tạp", "Phụ thuộc chính sách khó dự báo", "BCTC khó kiểm chứng hoặc biến động quá mạnh"],
      action: "Tạm bỏ qua",
      highlighted: false,
    },
  ];

  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Dùng kết luận ngành để chọn hướng phân tích tiếp, theo dõi thêm hoặc tạm bỏ qua."
        icon="ST"
        title="Từ ngành sang cổ phiếu"
      />
      <CardBody className="space-y-4">
        <div className="rounded-[4px] border border-accent bg-accent-soft px-4 py-3">
          <p className="text-sm font-bold text-ink">Ngành thuận lợi chưa chắc doanh nghiệp phù hợp.</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Dựa trên kết luận ngành hiện tại, hãy xác định nên phân tích tiếp, theo dõi thêm hay tạm bỏ qua.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-subtle">
            Không chuyển từ câu chuyện ngành thuận lợi sang kết luận hành động nếu chưa kiểm chứng bằng doanh nghiệp, BCTC, định giá và rủi ro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="accent">Gợi ý hiện tại: Đáng phân tích tiếp</Chip>
          <Chip variant="neutral">Quyết định có điều kiện</Chip>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {groups.map((group) => (
            <section
              key={group.title}
              className={[
                "rounded-[4px] px-4 py-4 transition",
                group.highlighted
                  ? "border-[1.5px] border-border bg-surface shadow-hard-sm"
                  : "border border-border-soft bg-surface-soft",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{group.title}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{group.description}</p>
                </div>
                {group.highlighted ? <Chip size="sm" variant="accent">Gợi ý</Chip> : null}
              </div>
              <div className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <p key={item} className="text-xs leading-5 text-muted">
                    {item}
                  </p>
                ))}
              </div>
              <div className="mt-4">
                <Button size="sm" variant={group.highlighted ? "primary" : "secondary"}>
                  {group.action}
                </Button>
              </div>
            </section>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function IndustryJourney({ data }: { data: IndustryJourneyData }) {
  return (
    <aside className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft xl:sticky xl:top-5 xl:self-start">
      <h3 className="text-sm font-bold text-ink">{data.title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{data.description}</p>
      <div className="mt-4 max-h-none space-y-2 xl:max-h-[calc(100dvh-180px)] xl:overflow-y-auto xl:pr-1">
        {data.steps.map((step, index) => (
          <details
            key={`${step.group}-${step.title}`}
            className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
            open={index < 2}
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-bold text-subtle">
                    {String(index + 1).padStart(2, "0")} · {step.group}
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink">{step.title}</p>
                </div>
                <Chip size="sm" variant="neutral">{step.status}</Chip>
              </div>
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-[11px] leading-4 text-muted">{step.question}</p>
              <p className="text-[11px] font-semibold text-subtle">
                Module: {step.linkedModule}
              </p>
              <TextList items={step.details.slice(0, 3)} />
              <Button size="sm" variant="ghost">Xem chi tiết</Button>
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}

function IndustryDataTable({ data }: { data: NonNullable<IndustryBlockData["table"]> }) {
  const columns: Array<DataTableColumn<IndustryTableRow>> = data.columns.map((column) => ({
    key: column.key,
    header: column.header,
    align: column.align,
    cell: (row) => row[column.key] ?? "",
  }));

  return (
    <DataTable
      caption={data.caption}
      columns={columns}
      getRowKey={(row, index) => `${row.indicator ?? row.macroVariable ?? row.template ?? index}-${index}`}
      rows={data.rows}
    />
  );
}

export function IndustryBlock({ data }: { data: IndustryBlockData }) {
  return (
    <IndustrySectionCard
      description={data.centralQuestion}
      icon={data.icon}
      title={data.title}
      action={<Chip variant="accent">Bước {data.stepNumber}</Chip>}
    >
      <div className="space-y-4">
        <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 shadow-hard-sm">
          <p className="text-xs font-bold text-ink">Nói dễ hiểu</p>
          <p className="mt-1 text-xs leading-5 text-muted">{data.easyExplanation}</p>
        </div>

        <FieldGrid items={data.fields} />

        {data.valueChain ? (
          <div className="grid gap-2 sm:grid-cols-4">
            {data.valueChain.map((node, index) => (
              <div
                key={node}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3 text-center shadow-hard-sm"
              >
                <p className="font-mono text-[11px] font-bold text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs font-bold text-ink">{node}</p>
              </div>
            ))}
          </div>
        ) : null}

        {data.states ? (
          <div className="grid gap-3 md:grid-cols-3">
            {data.states.map((state) => (
              <div
                key={state.label}
                className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{state.label}</p>
                  <StatusChip label="Theo dõi" tone={state.tone} />
                </div>
                <p className="text-xs leading-5 text-muted">{state.description}</p>
                <p className="mt-2 text-[11px] font-semibold text-subtle">
                  Xác nhận: {state.evidence}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  Dễ hiểu sai: {state.pitfall}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {data.examples ? (
          <div className="grid gap-3 md:grid-cols-3">
            {data.examples.map((example) => (
              <div
                key={example.title}
                className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
              >
                <p className="text-xs font-bold text-ink">{example.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{example.content}</p>
              </div>
            ))}
          </div>
        ) : null}

        {data.table ? <IndustryDataTable data={data.table} /> : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Dữ liệu cần xem</p>
            <TextList items={data.dataToWatch} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Liên kết module</p>
            <TextList items={data.moduleLinks} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Dễ hiểu sai ở đâu</p>
            <TextList items={data.pitfalls} />
          </div>
        </div>

      </div>
    </IndustrySectionCard>
  );
}

export function IndustryInsightPanel({ data }: { data: IndustryInsightPanelData }) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
      <IndustrySectionCard description={data.description} icon="LK" title={data.title}>
        <div className="space-y-3">
          {data.links.map((link) => (
            <div
              key={link.moduleName}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="text-xs font-bold text-ink">{link.moduleName}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{link.howItConnects}</p>
              <p className="mt-2 text-[11px] font-semibold text-subtle">
                Cần kiểm tra: {link.nextCheck}
              </p>
            </div>
          ))}
        </div>
      </IndustrySectionCard>
    </aside>
  );
}

export function IndustryTutorNote({ data }: { data: IndustryTutorData }) {
  return (
    <IndustrySectionCard icon="AI" title={data.title}>
      <TextList items={data.notes} />
    </IndustrySectionCard>
  );
}

export function IndustryDisclaimer({
  content,
  title,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Chip size="sm" variant="neutral">
          {title}
        </Chip>
        <p className="text-xs leading-5 text-muted">{content}</p>
      </div>
    </section>
  );
}

export function IndustryNextActions({
  actions,
  description,
  title,
}: {
  title: string;
  description: string;
  actions: IndustryAction[];
}) {
  return (
    <Card>
      <CardHeader description={description} icon=">" title={title} />
      <CardBody>
        <ActionButtons actions={actions} />
      </CardBody>
    </Card>
  );
}
