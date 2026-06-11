"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  aiExplanationOptions,
  industryChoices,
  journeyModeOptions,
  routeGoalOptions,
  stuckPoints,
} from "../data/route-config.data";
import type {
  AIExplanationLevelId,
  AssetInputMode,
  JourneyModeId,
  PersonalizedRoute,
  RouteConfigState,
  RouteGoalId,
  RouteOption,
} from "../types";

type RouteConfigPageProps = {
  onNavigate: (key: string) => void;
};

const stepLabels = ["Mục tiêu", "Cách đi", "Mức AI giải thích", "Điểm đang vướng", "Tạo lộ trình"];

const pathByGoal: Record<RouteGoalId, string[]> = {
  learn_from_scratch: ["Học tập", "Vĩ mô cơ bản", "Ngành cơ bản", "Hiểu doanh nghiệp", "BCTC cơ bản", "Watchlist"],
  analyze_stock: ["Hiểu doanh nghiệp", "BCTC", "Định giá", "Rủi ro", "PVT", "Checklist", "Mô phỏng", "Watchlist"],
  find_ideas: ["Vĩ mô", "Bản đồ ngành", "Phân tích ngành", "Lọc cổ phiếu", "Watchlist"],
  simulate_first: ["Checklist", "Thesis Builder", "Mô phỏng", "Hậu kiểm", "Watchlist"],
  review_decision: ["Checklist", "Rủi ro", "Định giá", "PVT", "Mô phỏng"],
  research_project: ["Tổng quan", "Học tập", "Vĩ mô", "Ngành", "Mô phỏng", "Hậu kiểm"],
};

const nextModuleByGoal: Record<RouteGoalId, { label: string; moduleKey: string }> = {
  learn_from_scratch: { label: "Bắt đầu Module Học tập", moduleKey: "learning" },
  analyze_stock: { label: "Bắt đầu Module Hiểu doanh nghiệp", moduleKey: "business" },
  find_ideas: { label: "Bắt đầu Module Vĩ mô", moduleKey: "macro" },
  simulate_first: { label: "Mở Watchlist", moduleKey: "watchlist" },
  review_decision: { label: "Mở Checklist", moduleKey: "checklist" },
  research_project: { label: "Xem Tổng quan", moduleKey: "overview" },
};

const initialConfig: RouteConfigState = {
  primaryGoal: "find_ideas",
  secondaryGoal: "",
  journeyMode: "step_by_step",
  aiExplanationLevel: "basic_with_examples",
  stuckPoints: [],
  customStuckPoint: "",
  assetInputMode: "none",
  selectedTicker: "",
  selectedIndustry: "",
};

function getOptionLabel<T extends string>(options: Array<RouteOption & { id: T }>, id: T | "") {
  return options.find((option) => option.id === id)?.title ?? "Chưa chọn";
}

function buildPersonalizedRoute(config: RouteConfigState): PersonalizedRoute {
  const selectedStuckPoints = stuckPoints.filter((point) => config.stuckPoints.includes(point.id));
  const baseLessons = selectedStuckPoints.map((point) => point.lesson);
  const recommendedLessons = Array.from(
    new Set([
      ...baseLessons,
      config.primaryGoal === "learn_from_scratch" ? "Lộ trình phân tích cổ phiếu cho người mới" : "",
      config.primaryGoal === "simulate_first" ? "Thesis đầu tư là gì?" : "",
      config.primaryGoal === "review_decision" ? "FOMO trong đầu tư là gì?" : "",
    ].filter(Boolean))
  );
  const softWarnings = selectedStuckPoints
    .map((point) => point.warning)
    .filter((warning): warning is string => Boolean(warning));

  if (softWarnings.length === 0) {
    softWarnings.push("Lộ trình này không phải khuyến nghị đầu tư. Nó chỉ giúp bạn biết nên học, phân tích và kiểm tra theo thứ tự nào.");
  }

  const assetLabel =
    config.assetInputMode === "ticker"
      ? config.selectedTicker || "Chưa nhập mã"
      : config.assetInputMode === "industry"
        ? config.selectedIndustry || "Chưa chọn ngành"
        : "Chưa có mã/ngành, bắt đầu từ Vĩ mô";

  return {
    goalLabel: getOptionLabel(routeGoalOptions, config.primaryGoal),
    secondaryGoalLabel: getOptionLabel(routeGoalOptions, config.secondaryGoal),
    journeyModeLabel: getOptionLabel(journeyModeOptions, config.journeyMode),
    aiLevelLabel: getOptionLabel(aiExplanationOptions, config.aiExplanationLevel),
    stuckPointLabels: [
      ...selectedStuckPoints.map((point) => point.label),
      config.customStuckPoint.trim(),
    ].filter(Boolean),
    assetLabel,
    recommendedPath: pathByGoal[config.primaryGoal],
    recommendedLessons:
      recommendedLessons.length > 0
        ? recommendedLessons
        : ["Lộ trình phân tích cổ phiếu cho người mới", "FOMO trong đầu tư là gì?"],
    softWarnings,
    nextAction: nextModuleByGoal[config.primaryGoal],
  };
}

function RouteConfigHeader({ currentStep }: { currentStep: number }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip variant="accent">Cấu hình lộ trình</Chip>
          <Chip variant="neutral">Bước {currentStep}/5</Chip>
        </div>
        <div>
          <h1 className="font-brand text-2xl font-bold leading-tight text-ink md:text-3xl">
            Cấu hình lộ trình
          </h1>
          <p className="mt-2 max-w-[860px] text-sm leading-7 text-muted">
            Chọn cách bạn muốn dùng hệ thống hôm nay. Hệ thống sẽ tạo lộ trình học, phân tích,
            mô phỏng hoặc checklist phù hợp với mục tiêu của bạn.
          </p>
        </div>
        <p className="rounded-[4px] border-[1.5px] border-border bg-accent-soft px-4 py-3 text-sm font-semibold leading-6 text-ink">
          Module này không đưa ra tín hiệu giao dịch. Mục tiêu là giúp bạn biết nên bắt đầu từ đâu
          và cần học hoặc kiểm tra gì trước khi đi tiếp.
        </p>
      </CardBody>
    </Card>
  );
}

function RouteConfigStepper({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <Card>
      <CardBody>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {stepLabels.map((label, index) => {
            const step = index + 1;
            const isActive = step === currentStep;
            const isDone = step < currentStep;

            return (
              <div key={label} className="flex min-w-[172px] flex-1 items-center gap-2">
                <button
                  className={cn(
                    "min-h-[56px] w-full rounded-[4px] border px-3 py-3 text-left transition",
                    isActive
                      ? "border-border bg-ink text-white shadow-hard-sm"
                      : isDone
                        ? "border-accent-green bg-accent-green/10 text-ink"
                        : "border-border-soft bg-surface-soft text-muted hover:border-border hover:bg-surface-hover"
                  )}
                  type="button"
                  onClick={() => onStepClick(step)}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="block text-[11px] font-bold">Bước {step}/5</span>
                  <span className="mt-1 block text-xs font-semibold">{label}</span>
                </button>
                {step < stepLabels.length ? (
                  <span className="hidden shrink-0 text-lg font-bold text-subtle md:inline" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
function OptionCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: RouteOption & { id: T };
  selected: boolean;
  onSelect: (id: T) => void;
}) {
  return (
    <button
      className={cn(
        "grid min-h-[220px] content-between rounded-[4px] border-[1.5px] px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5",
        selected ? "border-border bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-hover"
      )}
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
    >
      <span>
        <strong className={selected ? "block text-base text-white" : "block text-base text-ink"}>{option.title}</strong>
        <span className={selected ? "mt-2 block text-sm leading-6 text-white/75" : "mt-2 block text-sm leading-6 text-muted"}>
          {option.description}
        </span>
      </span>
      <span className="mt-4 grid gap-2">
        <span className={selected ? "text-[11px] font-bold text-accent" : "text-[11px] font-bold text-subtle"}>
          Phù hợp khi
        </span>
        {option.suitableWhen.slice(0, 3).map((item) => (
          <span key={item} className={selected ? "text-xs leading-5 text-white/75" : "text-xs leading-5 text-muted"}>
            {item}
          </span>
        ))}
        <span className={selected ? "mt-2 text-[11px] font-bold text-accent" : "mt-2 text-[11px] font-bold text-subtle"}>
          {option.suggestedPath.slice(0, 4).join(" → ")}
        </span>
      </span>
    </button>
  );
}

function GoalSelectionCards({
  config,
  setConfig,
}: {
  config: RouteConfigState;
  setConfig: (updater: (current: RouteConfigState) => RouteConfigState) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Hôm nay bạn muốn làm gì?"
        description="Hãy chọn mục tiêu gần nhất với nhu cầu của bạn hôm nay. Bạn có thể chỉnh lại sau."
      />
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {routeGoalOptions.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={config.primaryGoal === option.id}
            onSelect={(id) => setConfig((current) => ({ ...current, primaryGoal: id }))}
          />
        ))}
      </div>
    </section>
  );
}

function JourneyModeCards({
  value,
  onChange,
}: {
  value: JourneyModeId;
  onChange: (id: JourneyModeId) => void;
}) {
  return (
    <section>
      <SectionHeader title="Bạn muốn hệ thống dẫn bạn theo kiểu nào?" description="Chọn cách đi qua hệ thống phù hợp với mức độ quen thuộc của bạn." />
      <div className="grid gap-3 lg:grid-cols-2">
        {journeyModeOptions.map((option) => (
          <OptionCard key={option.id} option={option} selected={value === option.id} onSelect={onChange} />
        ))}
      </div>
    </section>
  );
}

function AIExplanationLevelCards({
  value,
  onChange,
}: {
  value: AIExplanationLevelId;
  onChange: (id: AIExplanationLevelId) => void;
}) {
  return (
    <section>
      <SectionHeader title="Bạn muốn trợ giảng giải thích ở mức nào?" description="Mức này sẽ dùng cho panel bên phải trong các module." />
      <div className="grid gap-3 lg:grid-cols-2">
        {aiExplanationOptions.map((option) => (
          <OptionCard key={option.id} option={option} selected={value === option.id} onSelect={onChange} />
        ))}
      </div>
    </section>
  );
}

function StuckPointSelector({
  selected,
  customValue,
  onToggle,
  onCustomChange,
}: {
  selected: string[];
  customValue: string;
  onToggle: (id: string) => void;
  onCustomChange: (value: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        title="Bạn thường vướng ở phần nào?"
        description="Không sao nếu bạn đang vướng nhiều phần. Hệ thống sẽ ưu tiên bài học ngắn và giải thích dễ hiểu hơn trong các module liên quan."
      />
      <div className="grid gap-2 md:grid-cols-2">
        {stuckPoints.map((point) => {
          const isSelected = selected.includes(point.id);

          return (
            <button
              key={point.id}
              className={cn(
                "rounded-[4px] border px-3 py-3 text-left text-xs font-semibold leading-5 transition",
                isSelected
                  ? "border-border bg-accent-soft text-ink shadow-hard-sm"
                  : "border-border-soft bg-surface text-muted hover:border-border hover:bg-surface-hover hover:text-ink"
              )}
              type="button"
              onClick={() => onToggle(point.id)}
              aria-pressed={isSelected}
            >
              {point.label}
            </button>
          );
        })}
      </div>
      <label className="mt-3 grid gap-2 rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
        <span className="text-xs font-bold text-ink">Tôi đang vướng phần khác</span>
        <textarea
          className="min-h-[96px] resize-y rounded-[3px] border border-border bg-surface-soft px-3 py-2 text-sm leading-6 text-ink outline-none focus:bg-accent-soft/35"
          placeholder="Nhập điều bạn đang bị rối, ví dụ: Tôi không biết nên bắt đầu từ mã cổ phiếu hay từ ngành trước..."
          value={customValue}
          onChange={(event) => onCustomChange(event.target.value)}
        />
        <span className="text-[11px] leading-5 text-muted">
          Bạn có thể viết bằng ngôn ngữ của mình. Hệ thống sẽ đưa nội dung này vào lộ trình cá nhân hóa.
        </span>
      </label>
    </section>
  );
}

function TickerIndustryInput({
  config,
  setConfig,
}: {
  config: RouteConfigState;
  setConfig: (updater: (current: RouteConfigState) => RouteConfigState) => void;
}) {
  const modes: Array<{ id: AssetInputMode; title: string; description: string }> = [
    { id: "ticker", title: "Tôi đã có mã cổ phiếu", description: "Ví dụ: PNJ, HPG, FPT, VCB" },
    { id: "industry", title: "Tôi có ngành muốn tìm hiểu", description: "Ví dụ: Ngân hàng, Bán lẻ, Thép, Dầu khí" },
    { id: "none", title: "Tôi chưa có mã/ngành", description: "Hệ thống có thể dẫn bạn đi từ Vĩ mô đến Ngành rồi mới lọc cổ phiếu." },
  ];

  return (
    <section>
      <SectionHeader title="Bạn đã có cổ phiếu hoặc ngành muốn phân tích chưa?" description="Bạn chưa cần có mã cổ phiếu ngay. Có thể bắt đầu từ Vĩ mô nếu chưa rõ." />
      <div className="grid gap-3 lg:grid-cols-3">
        {modes.map((mode) => {
          const isSelected = config.assetInputMode === mode.id;

          return (
            <button
              key={mode.id}
              className={cn(
                "rounded-[4px] border-[1.5px] px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5",
                isSelected ? "border-border bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-hover"
              )}
              type="button"
              onClick={() => setConfig((current) => ({ ...current, assetInputMode: mode.id }))}
            >
              <strong className={isSelected ? "block text-sm text-white" : "block text-sm text-ink"}>{mode.title}</strong>
              <span className={isSelected ? "mt-2 block text-xs leading-5 text-white/75" : "mt-2 block text-xs leading-5 text-muted"}>
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {config.assetInputMode === "ticker" ? (
          <label className="grid gap-2 rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
            <span className="text-xs font-bold text-ink">Nhập mã cổ phiếu</span>
            <input
              className="h-10 rounded-[3px] border border-border bg-surface-soft px-3 text-sm font-bold uppercase text-ink outline-none focus:bg-accent-soft/35"
              placeholder="PNJ, HPG, FPT, VCB"
              value={config.selectedTicker}
              onChange={(event) => setConfig((current) => ({ ...current, selectedTicker: event.target.value.toUpperCase() }))}
            />
          </label>
        ) : null}

        {config.assetInputMode === "industry" ? (
          <div className="rounded-[4px] border-[1.5px] border-border bg-surface px-4 py-4 shadow-soft">
            <p className="mb-3 text-xs font-bold text-ink">Chọn ngành</p>
            <div className="flex flex-wrap gap-2">
              {industryChoices.map((industry) => {
                const isSelected = config.selectedIndustry === industry;

                return (
                  <button
                    key={industry}
                    className={cn(
                      "rounded-[3px] border px-3 py-2 text-xs font-bold transition",
                      isSelected ? "border-border bg-accent text-ink shadow-hard-sm" : "border-border-soft bg-surface-soft text-muted hover:border-border hover:text-ink"
                    )}
                    type="button"
                    onClick={() => setConfig((current) => ({ ...current, selectedIndustry: industry }))}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RecommendedPathStepper({ steps }: { steps: string[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => (
        <div key={`${step}-${index}`} className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
          <p className="font-mono text-[11px] font-bold text-subtle">{String(index + 1).padStart(2, "0")}</p>
          <p className="mt-1 text-sm font-bold text-ink">{step}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendedLessonList({ lessons }: { lessons: string[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {lessons.map((lesson) => (
        <p key={lesson} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted">
          {lesson}
        </p>
      ))}
    </div>
  );
}

function SoftWarningList({ warnings }: { warnings: string[] }) {
  return (
    <div className="grid gap-2">
      {warnings.map((warning) => (
        <p key={warning} className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
          {warning}
        </p>
      ))}
    </div>
  );
}

function PersonalizedRouteResult({
  route,
  onNavigate,
  onReset,
}: {
  route: PersonalizedRoute;
  onNavigate: (key: string) => void;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Lộ trình của bạn"
        description="Đây là lộ trình đề xuất, không phải quy tắc bắt buộc. Bạn có thể chỉnh lại bất cứ lúc nào."
        chip={<Chip variant="success">Có thể bắt đầu</Chip>}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Mục tiêu hôm nay", route.goalLabel],
            ["Chế độ trải nghiệm", route.journeyModeLabel],
            ["Mức AI giải thích", route.aiLevelLabel],
            ["Mã/ngành quan tâm", route.assetLabel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
              <p className="text-[11px] font-semibold text-subtle">{label}</p>
              <p className="mt-1 text-sm font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <section>
          <SectionHeader title="Lộ trình đề xuất" description="Đi theo thứ tự này để giảm bỏ sót dữ liệu và rủi ro." />
          <RecommendedPathStepper steps={route.recommendedPath} />
        </section>

        {route.stuckPointLabels.length > 0 ? (
          <section>
            <SectionHeader title="Điểm đang vướng" />
            <div className="grid gap-2 md:grid-cols-2">
              {route.stuckPointLabels.map((point) => (
                <p
                  key={point}
                  className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-2 text-xs font-semibold leading-5 text-muted"
                >
                  {point}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title="Bài học nên học trước" />
          <RecommendedLessonList lessons={route.recommendedLessons} />
        </section>

        <section>
          <SectionHeader title="Cảnh báo mềm" />
          <SoftWarningList warnings={route.softWarnings} />
        </section>

        <section className="rounded-[4px] border border-border-soft bg-surface-soft px-4 py-4">
          <p className="text-sm font-bold text-ink">Panel trợ giảng sẽ hỗ trợ bạn như thế nào?</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            AI sẽ giải thích theo mức bạn chọn, gợi ý bài học khi bạn gặp phần khó, nhắc khi thiếu thesis,
            nhắc khi kết luận vội và dẫn bạn quay lại module còn thiếu.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate(route.nextAction.moduleKey)}>{route.nextAction.label}</Button>
          <Button variant="secondary">Lưu cấu hình</Button>
          <Button variant="secondary" onClick={onReset}>Chỉnh lại lựa chọn</Button>
          <Button variant="ghost" onClick={() => onNavigate("learning")}>Mở Module Học tập</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function StepNavigation({
  currentStep,
  onNext,
  onBack,
  onCreateRoute,
}: {
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onCreateRoute: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <Button disabled={currentStep === 1} variant="secondary" onClick={onBack}>
        Quay lại
      </Button>
      <Button onClick={currentStep === 5 ? onCreateRoute : onNext}>
        {currentStep === 5 ? "Tạo lộ trình" : "Tiếp tục"}
      </Button>
    </div>
  );
}

export function RouteConfigPage({ onNavigate }: RouteConfigPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<RouteConfigState>(initialConfig);
  const [hasGeneratedRoute, setHasGeneratedRoute] = useState(false);
  const route = useMemo(() => buildPersonalizedRoute(config), [config]);

  const updateConfig = (updater: (current: RouteConfigState) => RouteConfigState) => {
    setHasGeneratedRoute(false);
    setConfig(updater);
  };

  function toggleStuckPoint(id: string) {
    updateConfig((current) => ({
      ...current,
      stuckPoints: current.stuckPoints.includes(id)
        ? current.stuckPoints.filter((item) => item !== id)
        : [...current.stuckPoints, id],
    }));
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5">
      <RouteConfigHeader currentStep={currentStep} />
      <RouteConfigStepper currentStep={currentStep} onStepClick={setCurrentStep} />

      {currentStep === 1 ? <GoalSelectionCards config={config} setConfig={updateConfig} /> : null}
      {currentStep === 2 ? (
        <JourneyModeCards
          value={config.journeyMode}
          onChange={(id) => updateConfig((current) => ({ ...current, journeyMode: id }))}
        />
      ) : null}
      {currentStep === 3 ? (
        <AIExplanationLevelCards
          value={config.aiExplanationLevel}
          onChange={(id) => updateConfig((current) => ({ ...current, aiExplanationLevel: id }))}
        />
      ) : null}
      {currentStep === 4 ? (
        <StuckPointSelector
          selected={config.stuckPoints}
          customValue={config.customStuckPoint}
          onToggle={toggleStuckPoint}
          onCustomChange={(value) => updateConfig((current) => ({ ...current, customStuckPoint: value }))}
        />
      ) : null}
      {currentStep === 5 ? <TickerIndustryInput config={config} setConfig={updateConfig} /> : null}

      <StepNavigation
        currentStep={currentStep}
        onBack={() => setCurrentStep((step) => Math.max(1, step - 1))}
        onNext={() => setCurrentStep((step) => Math.min(5, step + 1))}
        onCreateRoute={() => setHasGeneratedRoute(true)}
      />

      {hasGeneratedRoute ? (
        <PersonalizedRouteResult
          route={route}
          onNavigate={onNavigate}
          onReset={() => {
            setHasGeneratedRoute(false);
            setCurrentStep(1);
          }}
        />
      ) : null}
    </div>
  );
}
