import { useState, type ReactNode } from "react";
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

export function IndustryThesisHeader({
  selectedIndustry,
}: {
  selectedIndustry: IndustryOption;
}) {
  return (
    <section className="parent-surface-card rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
      <div className="max-w-[860px]">
        <Chip variant="accent">Phân tích ngành</Chip>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink md:text-3xl">
          Xây luận điểm ngành trước khi chọn cổ phiếu
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Hiểu trạng thái ngành, lực vĩ mô đang hỗ trợ hoặc gây áp lực, bộ dữ liệu cần theo dõi và nhóm doanh nghiệp đáng phân tích tiếp. Đây không phải là khuyến nghị mua bán.
        </p>
        <div className="mt-4 rounded-[4px] border border-border-soft bg-accent-soft px-3 py-3">
          <p className="text-xs font-bold text-ink">
            Ngành tốt chưa chắc cổ phiếu tốt. Bạn vẫn cần kiểm tra mô hình kinh doanh, BCTC, định giá và rủi ro của từng doanh nghiệp.
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
  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Mở từng cụm để xem các bước bên trong. Danh sách này dùng để định vị và chọn bước đang làm, không phải một checklist dài cần đọc hết một lượt."
        icon="17"
        title="Lộ trình 5 cụm phân tích"
      />
      <CardBody className="bg-surface-soft/45">
        <div className="space-y-3">
          {industryClusters.map((cluster, index) => {
            const clusterBlocks = blocks.filter(
              (block) =>
                block.stepNumber >= cluster.range[0] &&
                block.stepNumber <= cluster.range[1]
            );
            const hasActive = clusterBlocks.some((block) => block.id === activeStepId);

            return (
              <details
                key={cluster.id}
                className={[
                  "rounded-[4px] px-4 py-4 transition",
                  hasActive
                    ? "border-[1.5px] border-border bg-surface shadow-hard-sm"
                    : "border border-transparent bg-transparent hover:bg-surface/55",
                ].join(" ")}
                open={index === 0 || hasActive}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-[11px] font-bold text-subtle">
                        Cụm {index + 1} - {clusterBlocks.length} bước
                      </p>
                      <h3 className="mt-1 text-base font-bold text-ink">{cluster.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{cluster.question}</p>
                    </div>
                    <Chip size="sm" variant={hasActive ? "accent" : "neutral"}>
                      {hasActive ? "Đang làm" : "Chưa mở"}
                    </Chip>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-subtle">
                    Output: {cluster.output}
                  </p>
                </summary>

                <div className="mt-4 grid gap-1.5 border-t border-border-soft pt-3">
                  {clusterBlocks.map((block) => {
                    const isActive = block.id === activeStepId;

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => onSelectStep(block.id)}
                        className={[
                          "rounded-[4px] px-3 py-3 text-left transition",
                          isActive
                            ? "border border-border bg-ink text-white shadow-hard-sm"
                            : "border border-transparent bg-transparent hover:bg-surface hover:shadow-soft",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className={isActive ? "font-mono text-[11px] font-bold text-accent" : "font-mono text-[11px] font-bold text-subtle"}>
                              Bước {block.stepNumber}
                            </p>
                            <p className={isActive ? "mt-1 text-sm font-bold text-white" : "mt-1 text-sm font-bold text-ink"}>
                              {block.title}
                            </p>
                            <p className={isActive ? "mt-1 text-xs leading-5 text-white/75" : "mt-1 text-xs leading-5 text-muted"}>
                              {block.centralQuestion}
                            </p>
                          </div>
                          <Chip size="sm" variant={isActive ? "accent" : "neutral"}>
                            {isActive ? "Đang chọn" : "Mở bước này"}
                          </Chip>
                        </div>
                        <p className={isActive ? "mt-2 text-xs leading-5 text-white/75" : "mt-2 text-xs leading-5 text-muted"}>
                          Output: {stepOutput(block)}
                        </p>
                        <p className={isActive ? "mt-2 text-[11px] font-semibold text-white/70" : "mt-2 text-[11px] font-semibold text-subtle"}>
                          Module liên quan: {block.moduleLinks.join(", ")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
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
  const reasons = selectedIndustry.keyQuestions.slice(0, 3);

  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Chốt trạng thái ngành bằng điều kiện rõ ràng, không biến kết luận ngành thành khuyến nghị mua bán."
        icon="KL"
        title="Kết luận ngành có điều kiện"
      />
      <CardBody>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-bold text-ink">Trạng thái có thể chọn</p>
              <div className="flex flex-wrap gap-2">
                {["Hưởng lợi", "Bất lợi", "Trung lập", "Chuyển pha", "Chưa đủ dữ liệu"].map((status) => (
                  <Chip key={status} variant={status === "Chưa đủ dữ liệu" ? "warning" : "neutral"}>
                    {status}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-ink">3 lý do chính</p>
              <TextList items={reasons} />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-ink">Điều kiện làm thesis sai</p>
              <TextList
                items={[
                  "Dữ liệu dẫn dắt không đi vào sản lượng hoặc biên lợi nhuận.",
                  "Cung mới, tồn kho hoặc cạnh tranh làm lợi thế ngành bị pha loãng.",
                  "BCTC doanh nghiệp không xác nhận câu chuyện ngành.",
                ]}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink">Hành động tiếp theo</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Lọc cổ phiếu", "Hiểu doanh nghiệp", "BCTC", "Định giá", "Watchlist"].map((action) => (
                <Button key={action} size="sm" variant="secondary">
                  {action}
                </Button>
              ))}
            </div>
            <div className="mt-4 rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-xs font-bold text-ink">{selectedIndustry.name}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Kết luận nên ghi theo dạng: ngành đang ở trạng thái nào, dựa trên dữ liệu nào, và điều kiện nào sẽ làm bạn đổi ý.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function IndustryToStockBridge() {
  const groups = [
    {
      title: "Đáng phân tích tiếp",
      items: ["Có lợi thế rõ trong ngành", "BCTC xác nhận bằng biên lợi nhuận hoặc dòng tiền", "Rủi ro chính có thể theo dõi được"],
    },
    {
      title: "Cần theo dõi thêm",
      items: ["Câu chuyện ngành đúng nhưng dữ liệu doanh nghiệp còn thiếu", "Định giá đã phản ánh quá nhiều kỳ vọng", "Có một biến rủi ro chưa rõ"],
    },
    {
      title: "Chưa phù hợp với người mới",
      items: ["Mô hình quá phức tạp", "Phụ thuộc chính sách khó dự báo", "BCTC khó kiểm chứng hoặc biến động quá mạnh"],
    },
  ];

  return (
    <Card className="parent-surface-card border-border-soft">
      <CardHeader
        description="Cầu nối này giúp người dùng không nhảy từ ngành tốt sang mua cổ phiếu quá nhanh."
        icon="ST"
        title="Từ ngành sang cổ phiếu"
      />
      <CardBody>
        <div className="mb-4 rounded-[4px] border border-border bg-accent-soft px-3 py-3">
          <p className="text-sm font-bold text-ink">Ngành tốt chưa chắc cổ phiếu tốt.</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Bước tiếp theo là lọc ra doanh nghiệp có vị thế, BCTC và định giá phù hợp để phân tích sâu hơn.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
            >
              <p className="text-sm font-bold text-ink">{group.title}</p>
              <TextList items={group.items} />
            </div>
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
    <Card className="bg-surface-soft">
      <CardHeader icon="!" title={title} />
      <CardBody>
        <p className="text-xs leading-5 text-muted">{content}</p>
      </CardBody>
    </Card>
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
