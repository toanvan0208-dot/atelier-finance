"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, StepAccordion } from "@/components/ui";
import { cn } from "@/lib/cn";
import { simulationExperienceData } from "../data/simulation.data";
import type {
  FieldItem,
  HistoricalCaseCard,
  SimulationModeId,
  Tone,
} from "../types";

const toneVariant: Record<Tone, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  accent: "accent",
  danger: "danger",
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

const modeLabels: Record<SimulationModeId, string> = {
  current: "Mô phỏng hiện tại",
  scenario: "Kiểm tra kịch bản",
  history: "Case study lịch sử",
};

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function FieldGrid({ items }: { items: FieldItem[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2"
        >
          <p className="text-[11px] font-semibold text-subtle">{item.label}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold leading-5 text-ink">{item.value}</p>
            {item.tone ? (
              <Chip size="sm" variant={toneVariant[item.tone]}>
                {item.tone}
              </Chip>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}

function ModeChooser({
  activeMode,
  onSelect,
}: {
  activeMode: SimulationModeId | null;
  onSelect: (mode: SimulationModeId) => void;
}) {
  const data = simulationExperienceData;

  return (
    <Card>
      <CardHeader
        chip={<Chip variant="accent">Bước đầu tiên</Chip>}
        title={data.modePrompt}
        description="Chọn đúng chế độ trước khi nhập bất kỳ thông tin vị thế nào."
      />
      <CardBody>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.modes.map((mode) => {
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                className={cn(
                  "rounded-[4px] border-[1.5px] px-4 py-4 text-left transition active:translate-y-[1px]",
                  isActive
                    ? "border-border bg-accent-soft shadow-hard-sm"
                    : "border-border-soft bg-surface-soft hover:border-border hover:bg-surface-hover"
                )}
                type="button"
                onClick={() => onSelect(mode.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{mode.title}</h3>
                  {isActive ? <Chip variant="accent">Đang chọn</Chip> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{mode.description}</p>
                <div className="mt-3 grid gap-1.5">
                  {mode.bestFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-[3px] border border-border-soft bg-surface px-2 py-1 text-[11px] leading-4 text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-ink">
                  Output: {mode.primaryOutput}
                </p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function CurrentSimulationMode() {
  const data = simulationExperienceData.current;
  const [capital, setCapital] = useState(data.defaultCapital);
  const [weight, setWeight] = useState(data.defaultWeight);
  const positionValue = Math.floor((capital * weight) / 100);
  const shareQuantity = Math.floor(positionValue / data.stock.startPrice / 10) * 10;
  const actualPositionValue = shareQuantity * data.stock.startPrice;
  const remainingCash = capital - actualPositionValue;
  const estimatedPnL = shareQuantity * (data.stock.currentPrice - data.stock.startPrice);

  const positionFields: FieldItem[] = [
    { label: "Vốn giả lập", value: formatVnd(capital) },
    { label: "Tỷ trọng vị thế", value: `${weight}%`, tone: weight > 15 ? "warning" : "neutral" },
    { label: "Giá bắt đầu mô phỏng", value: formatVnd(data.stock.startPrice) },
    { label: "Giá trị vị thế", value: formatVnd(actualPositionValue) },
    { label: "Số lượng cổ phiếu", value: `${shareQuantity} cổ phiếu`, tone: "accent" },
    { label: "Tiền mặt còn lại", value: formatVnd(remainingCash) },
    { label: "Phí/thuế giả lập", value: "Chưa áp dụng" },
    { label: "Lãi/lỗ giả lập", value: formatVnd(estimatedPnL), tone: "neutral" },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          chip={<Chip variant="accent">Không phải màn đặt lệnh</Chip>}
          title="Chế độ mô phỏng hiện tại"
          description="Nhập vốn và tỷ trọng chỉ xuất hiện sau khi đã chọn cổ phiếu, kiểm tra dữ liệu nền, viết thesis và xem PVT rút gọn."
        />
        <CardBody>
          <StepAccordion
            title="Flow mô phỏng hiện tại"
            description="Thesis đi trước vị thế. Hệ thống tự tính số lượng cổ phiếu để người mới học phân bổ vốn."
            items={[
              {
                key: "stock",
                order: 1,
                title: "Chọn cổ phiếu muốn mô phỏng",
                status: "Đã hoàn thành",
                description: "Chọn mã theo dõi, không hỏi số lượng cổ phiếu ngay từ đầu.",
                content: (
                  <FieldGrid
                    items={[
                      { label: "Mã cổ phiếu", value: data.stock.ticker, tone: "accent" },
                      { label: "Doanh nghiệp", value: data.stock.companyName },
                      { label: "Ngành", value: data.stock.industry },
                    ]}
                  />
                ),
                defaultOpen: true,
              },
              {
                key: "precheck",
                order: 2,
                title: "Kiểm tra dữ liệu nền đã có chưa",
                status: "Cần xem lại",
                description: "Nếu thiếu dữ liệu nền, mô phỏng dễ biến thành xem giá lên xuống.",
                content: (
                  <div className="grid gap-2">
                    {data.precheck.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold text-ink">{item.label}</p>
                            <p className="mt-1 text-[11px] text-subtle">
                              Nguồn: {item.sourceModule}
                            </p>
                          </div>
                          <Chip
                            variant={
                              item.status === "Đã có"
                                ? "success"
                                : item.status === "Cần bổ sung"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {item.status}
                          </Chip>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted">{item.note}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "thesis",
                order: 3,
                title: "Viết thesis mô phỏng",
                status: "Đang làm",
                description: "Phải biết mình đang kiểm tra điều gì trước khi tạo vị thế theo dõi.",
                content: (
                  <div className="space-y-3">
                    <TextList items={data.thesisPrompts} />
                    <div className="rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
                      Bạn chưa có thesis rõ ràng. Mô phỏng sẽ dễ biến thành xem
                      giá lên/xuống nếu bạn không biết mình đang kiểm tra điều gì.
                    </div>
                  </div>
                ),
              },
              {
                key: "pvt",
                order: 4,
                title: "Xem dashboard PVT rút gọn",
                status: "Đang làm",
                description: "Chart là một phần để kiểm tra thesis, không phải toàn bộ màn hình.",
                content: (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {data.pvt.toggles.map((toggle) => (
                          <Chip key={toggle} variant="neutral">
                            {toggle}
                          </Chip>
                        ))}
                      </div>
                      <div className="grid min-h-[220px] place-items-center rounded-[4px] border border-border-soft bg-surface px-4 py-6 text-center">
                        <div>
                          <p className="font-mono text-2xl font-bold text-ink">
                            PVT
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted">
                            Biểu đồ giá, volume, benchmark VN-Index, benchmark
                            ngành và mốc sự kiện sẽ được gắn tại đây.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <FieldGrid items={data.pvt.cards} />
                      </div>
                    </div>
                    <div>
                      <SectionTitle title="Câu hỏi PVT trong mô phỏng" />
                      <div className="mt-3">
                        <TextList items={data.pvt.questions} />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "capital",
                order: 5,
                title: "Nhập vốn giả lập",
                status: "Đang làm",
                description: "Sau thesis, người dùng mới nhập vốn giả lập.",
                content: (
                  <label className="grid gap-2">
                    <span className="text-xs font-bold text-ink">
                      Vốn giả lập của bạn là bao nhiêu?
                    </span>
                    <input
                      className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-bold text-ink outline-none"
                      min={0}
                      step={1000000}
                      type="number"
                      value={capital}
                      onChange={(event) => setCapital(Number(event.target.value) || 0)}
                    />
                    <span className="text-xs text-muted">Ví dụ: 100.000.000đ.</span>
                  </label>
                ),
              },
              {
                key: "weight",
                order: 6,
                title: "Chọn tỷ trọng hoặc giá trị vị thế",
                status: "Đang làm",
                description: "Hỏi tỷ trọng trước, không hỏi muốn mô phỏng bao nhiêu cổ phiếu.",
                content: (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15].map((value) => (
                        <Button
                          key={value}
                          size="sm"
                          variant={weight === value ? "primary" : "secondary"}
                          onClick={() => setWeight(value)}
                        >
                          {value}%
                        </Button>
                      ))}
                    </div>
                    <label className="grid gap-2">
                      <span className="text-xs font-bold text-ink">Tỷ trọng tùy chỉnh</span>
                      <input
                        className="h-10 rounded-[4px] border-[1.5px] border-border bg-surface px-3 text-sm font-bold text-ink outline-none"
                        max={100}
                        min={0}
                        type="number"
                        value={weight}
                        onChange={(event) => setWeight(Number(event.target.value) || 0)}
                      />
                    </label>
                  </div>
                ),
              },
              {
                key: "calculation",
                order: 7,
                title: "Hệ thống tự tính số lượng cổ phiếu",
                status: "Đã hoàn thành",
                description: "Tự động quy đổi từ vốn và tỷ trọng sang số cổ phiếu.",
                content: <FieldGrid items={positionFields} />,
              },
              {
                key: "milestones",
                order: 8,
                title: "Đặt mốc xem lại thesis",
                status: "Đang làm",
                description: "Không gọi là chốt lời/cắt lỗ. Đây chỉ là mốc dừng lại để kiểm tra luận điểm.",
                content: (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {data.reviewMilestones.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <h4 className="text-sm font-bold text-ink">{group.title}</h4>
                        <div className="mt-2">
                          <TextList items={group.examples} />
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "create",
                order: 9,
                title: "Tạo vị thế theo dõi giả lập",
                status: "Chưa làm",
                description: "Nút hành động dùng ngôn ngữ mềm và đặt trọng tâm vào theo dõi thesis.",
                content: (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary">Tạo mô phỏng theo dõi</Button>
                    <Button variant="secondary">Lưu nháp thesis</Button>
                  </div>
                ),
              },
              {
                key: "dashboard",
                order: 10,
                title: "Theo dõi dashboard mô phỏng",
                status: "Đang làm",
                description: "Dashboard đặt thesis và dữ liệu xác nhận ở trung tâm, không phóng đại lãi/lỗ.",
                content: (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                      <FieldGrid items={data.dashboard.header} />
                      <FieldGrid items={positionFields} />
                      <FieldGrid items={data.dashboard.positionNotes} />
                    </div>
                    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
                      <SectionTitle
                        title="Thesis Panel"
                        description="Đây mới là phần quan trọng trong dashboard mô phỏng."
                      />
                      <div className="mt-3">
                        <FieldGrid items={data.dashboard.thesisPanel} />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "journal",
                order: 11,
                title: "Ghi nhật ký và hậu kiểm",
                status: "Chưa làm",
                description: "Mỗi biến động mới cần được ghi thành câu hỏi học tập.",
                content: (
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.journalPrompts.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <p className="text-sm font-bold text-ink">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{item.prompt}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function ScenarioMode() {
  const data = simulationExperienceData.scenario;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          chip={<Chip variant="accent">5 bước ngắn</Chip>}
          title="Chế độ kiểm tra kịch bản giả định"
          description="Không chỉ hiện kết quả. Giao diện bắt người dùng hiểu kênh tác động và trả lời thesis còn đứng vững không."
        />
        <CardBody>
          <StepAccordion
            title="Flow kiểm tra kịch bản"
            description="Từ loại kịch bản đến output học tập cuối cùng."
            items={[
              {
                key: "type",
                order: 1,
                title: "Chọn loại kịch bản",
                status: "Đang làm",
                description: "Chọn nhóm rủi ro muốn stress-test.",
                content: (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {data.groups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
                      >
                        <h4 className="text-sm font-bold text-ink">{group.title}</h4>
                        <div className="mt-3">
                          <TextList items={group.examples} />
                        </div>
                      </div>
                    ))}
                  </div>
                ),
                defaultOpen: true,
              },
              {
                key: "impact",
                order: 2,
                title: "Chọn mức độ tác động",
                status: "Đang làm",
                description: "Người mới cần giải thích nhẹ/vừa/mạnh nghĩa là gì.",
                content: (
                  <div className="grid gap-3 md:grid-cols-3">
                    {data.impactLevels.map((level) => (
                      <div
                        key={level.label}
                        className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-ink">{level.label}</h4>
                          <Chip variant="neutral">{level.value}</Chip>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted">
                          {level.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "transmission",
                order: 3,
                title: "Xem kênh tác động",
                status: "Đang làm",
                description: "Đây là phần quan trọng nhất: hiểu vì sao kịch bản ảnh hưởng cổ phiếu.",
                content: (
                  <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-7">
                    {data.transmissionExample.map((step, index) => (
                      <div
                        key={step}
                        className="min-h-[96px] rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3"
                      >
                        <p className="font-mono text-[11px] font-bold text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-ink">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "questions",
                order: 4,
                title: "Hệ thống hỏi người dùng",
                status: "Đang làm",
                description: "Không để người dùng chỉ xem kết quả thụ động.",
                content: <TextList items={data.tutorQuestions} />,
              },
              {
                key: "output",
                order: 5,
                title: "Output cuối",
                status: "Chưa làm",
                description: "Tên output: Bản kiểm tra kịch bản giả định.",
                content: (
                  <div>
                    <SectionTitle title="Bản kiểm tra kịch bản giả định" />
                    <div className="mt-3">
                      <TextList items={data.outputFields} />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function CaseCard({ item }: { item: HistoricalCaseCard }) {
  return (
    <article className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-ink">{item.caseName}</h4>
          <p className="mt-1 text-xs font-semibold text-subtle">
            {item.tickerOrGroup} · {item.startPoint}
          </p>
        </div>
        <Chip variant="accent">{item.difficulty}</Chip>
      </div>
      <div className="mt-3 grid gap-2 text-xs leading-5 text-muted">
        <p>Loại case: {item.type}</p>
        <p>Bài học chính: {item.mainLesson}</p>
        <p>Dữ liệu bị khóa: {item.lockedData}</p>
        <p>Kỹ năng luyện: {item.skill}</p>
      </div>
      <div className="mt-3">
        <Button size="sm" variant="primary">Bắt đầu case</Button>
      </div>
    </article>
  );
}

function HistoryMode() {
  const data = simulationExperienceData.history;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          chip={<Chip variant="accent">Time-locked</Chip>}
          title="Chế độ case study lịch sử"
          description="Giao diện gồm 4 vùng: Case Library, Time-Locked Workspace, Decision Panel và Replay Timeline."
        />
        <CardBody className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {data.zones.map((zone) => (
              <Chip key={zone} variant="neutral">{zone}</Chip>
            ))}
          </div>

          <section>
            <SectionTitle
              title="Vùng 1: Case Library"
              description="Chọn tình huống lịch sử để học mà không nhìn trước kết quả."
            />
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              {data.cases.map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section className="rounded-[4px] border-[1.5px] border-border bg-accent-soft/50 px-4 py-4">
            <SectionTitle
              title="Vùng 2: Time-Locked Analysis Workspace"
              description={`Bạn đang đứng tại ngày: ${data.lockedWorkspace.asOfDate}`}
            />
            <p className="mt-2 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
              {data.lockedWorkspace.warning}
            </p>
            <div className="mt-3">
              <FieldGrid items={data.lockedWorkspace.tabs} />
            </div>
          </section>

          <section>
            <SectionTitle
              title="Vùng 3: Quyết định giả lập của tôi"
              description="Không dùng ngôn ngữ đặt lệnh làm trung tâm. Người dùng phải viết thesis trước khi xác nhận."
            />
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Lựa chọn quyết định</p>
                <TextList items={data.decisionOptions} />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-ink">Trường bắt buộc</p>
                <TextList items={data.requiredFields} />
              </div>
            </div>
            <div className="mt-3 rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
              Nếu bạn chưa viết được lý do bằng 2-3 câu, bạn chưa thật sự có
              quyết định để hậu kiểm.
            </div>
          </section>

          <section>
            <SectionTitle
              title="Vùng 4: Replay Timeline"
              description="Sau khi ghi quyết định, hệ thống mới mở dần tương lai theo từng mốc."
            />
            <div className="mt-3 grid gap-3">
              {data.replayTimeline.map((item) => (
                <div
                  key={item.milestone}
                  className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3"
                >
                  <h4 className="text-sm font-bold text-ink">{item.milestone}</h4>
                  <div className="mt-2">
                    <TextList items={item.newData} />
                  </div>
                  <p className="mt-3 rounded-[4px] border border-border-soft bg-surface px-3 py-2 text-xs leading-5 text-muted">
                    Câu hỏi: {item.reflectionQuestion}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Hậu kiểm cuối case" />
            <div className="mt-3">
              <FieldGrid items={data.postReviewTypes} />
            </div>
            <div className="mt-3 rounded-[4px] border border-border bg-accent-soft px-3 py-3 text-xs leading-5 text-muted">
              Một kết quả lãi nhưng sai quy trình vẫn là bài học rủi ro. Một
              kết quả lỗ nhưng đúng quy trình vẫn có thể là bài học tốt.
            </div>
          </section>
        </CardBody>
      </Card>
    </div>
  );
}

export function SimulationPage() {
  const [activeMode, setActiveMode] = useState<SimulationModeId | null>(null);
  const data = simulationExperienceData;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-5 py-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-[3px] border-[1.5px] border-border bg-accent-soft text-[10px] font-bold text-accent">
            MP
          </span>
          <Chip variant={activeMode ? "accent" : "warning"}>
            {activeMode ? modeLabels[activeMode] : "Chưa chọn chế độ"}
          </Chip>
        </div>
        <h1 className="font-brand text-2xl font-bold text-ink sm:text-3xl">
          {data.title}
        </h1>
        <p className="mt-2 max-w-[760px] text-sm leading-7 text-muted">
          {data.subtitle}
        </p>
      </div>

      <ModeChooser activeMode={activeMode} onSelect={setActiveMode} />

      {!activeMode ? (
        <Card>
          <CardBody>
            <div className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4 text-sm leading-6 text-muted">
              Hãy chọn một chế độ mô phỏng ở trên. Hệ thống sẽ không hỏi vốn,
              tỷ trọng hay số lượng cổ phiếu trước khi bạn chọn chế độ và viết
              thesis phù hợp.
            </div>
          </CardBody>
        </Card>
      ) : null}

      {activeMode === "current" ? <CurrentSimulationMode /> : null}
      {activeMode === "scenario" ? <ScenarioMode /> : null}
      {activeMode === "history" ? <HistoryMode /> : null}

      <Card>
        <CardHeader
          chip={<Chip variant="warning">Guardrail</Chip>}
          title={data.disclaimer.title}
        />
        <CardBody>
          <p className="text-sm leading-7 text-muted">{data.disclaimer.content}</p>
        </CardBody>
      </Card>
    </div>
  );
}
