"use client";

import { useMemo, useState } from "react";
import { aiTutorConfig, fallbackAITutorConfig, type AITutorConfig } from "@/config/aiTutor.config";
import { cn } from "@/lib/cn";

type AITutorTab = "guide" | "ask" | "learn";

type RightAssistantPanelProps = {
  activeModule: string;
  onNavigate?: (key: string) => void;
};

const tabs: Array<{ key: AITutorTab; label: string }> = [
  { key: "guide", label: "Hướng dẫn" },
  { key: "ask", label: "Hỏi AI" },
  { key: "learn", label: "Học nhanh" },
];

function getTutorConfig(activeModule: string): AITutorConfig {
  return aiTutorConfig[activeModule] ?? fallbackAITutorConfig;
}

function AITutorQuestionList({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect: (question: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {questions.map((question) => (
        <button
          key={question}
          className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-left text-xs font-semibold leading-5 text-muted transition hover:border-border hover:bg-surface-hover hover:text-ink"
          type="button"
          onClick={() => onSelect(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}

function AITutorSoftWarning({ children }: { children: string }) {
  return (
    <div className="rounded-[4px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs font-semibold leading-5 text-[#765416]">
      {children}
    </div>
  );
}

function AITutorNextActionCard({
  config,
  onNavigate,
}: {
  config: AITutorConfig;
  onNavigate?: (key: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {config.nextActions.slice(0, 3).map((action) => (
        <button
          key={action.label}
          className={cn(
            "rounded-[3px] border-[1.5px] border-border px-3 py-2 text-left text-xs font-bold shadow-hard-sm transition hover:-translate-y-0.5",
            action.primary
              ? "bg-accent text-ink hover:bg-[#DCA900]"
              : "bg-surface text-ink hover:bg-surface-hover"
          )}
          type="button"
          onClick={() => onNavigate?.(action.moduleKey)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function AITutorRecommendedLessonCard({
  lesson,
}: {
  lesson: AITutorConfig["recommendedLessons"][number];
}) {
  return (
    <article className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <h4 className="text-xs font-bold text-ink">{lesson.title}</h4>
      <p className="mt-1 text-[11px] font-semibold text-subtle">
        {lesson.duration} · Dùng trong: {lesson.usedIn}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted">{lesson.reason}</p>
      <div className="mt-3 flex gap-2">
        <button className="rounded-[3px] border-[1.5px] border-border bg-accent px-2.5 py-1 text-[11px] font-bold text-ink shadow-hard-sm" type="button">
          Học nhanh
        </button>
        <button className="rounded-[3px] border border-border-soft bg-surface px-2.5 py-1 text-[11px] font-bold text-muted" type="button">
          Để sau
        </button>
      </div>
    </article>
  );
}

function AITutorGuideTab({
  config,
  onNavigate,
}: {
  config: AITutorConfig;
  onNavigate?: (key: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Bạn đang ở đâu?</h3>
        <p className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          Bạn đang ở Module {config.moduleName}. {config.currentGoal}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Bước này dùng để làm gì?</h3>
        <p className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
          {config.whatThisStepDoes}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Bạn cần kiểm tra gì?</h3>
        <div className="grid gap-2">
          {config.questionsToCheck.slice(0, 6).map((question) => (
            <p key={question} className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
              {question}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Điểm dễ hiểu sai</h3>
        <div className="grid gap-2">
          {config.commonMistakes.slice(0, 3).map((mistake) => (
            <p key={mistake} className="rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-xs leading-5 text-[#765416]">
              {mistake}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Hành động tiếp theo</h3>
        <AITutorNextActionCard config={config} onNavigate={onNavigate} />
      </section>

      <AITutorSoftWarning>{config.softWarning}</AITutorSoftWarning>
    </div>
  );
}

function AskAIInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
      <label className="grid gap-2">
        <span className="text-xs font-bold text-ink">Nhập câu hỏi</span>
        <textarea
          className="min-h-[84px] resize-none rounded-[3px] border border-border bg-surface px-3 py-2 text-xs leading-5 text-ink outline-none focus:bg-accent-soft/35"
          placeholder="Ví dụ: P/E thấp có phải cổ phiếu rẻ không?"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button
        className="mt-3 rounded-[3px] border-[1.5px] border-border bg-accent px-3 py-2 text-xs font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-[#DCA900]"
        type="button"
        onClick={onSubmit}
      >
        Hỏi AI
      </button>
    </div>
  );
}

function AITutorAskTab({ config }: { config: AITutorConfig }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "Chọn một câu hỏi gợi ý hoặc nhập câu hỏi. AI sẽ giải thích theo hướng học tập, không đưa ra tín hiệu mua/bán."
  );

  function submitQuestion() {
    const trimmed = question.trim();

    setAnswer(
      trimmed
        ? `Cách đọc an toàn: "${trimmed}" cần được nối với dữ liệu trong Module ${config.moduleName}. Hãy kiểm tra dữ liệu còn thiếu, rủi ro và giả định trước khi tự kết luận.`
        : "Hãy nhập câu hỏi cụ thể hơn để AI giải thích theo ngữ cảnh module hiện tại."
    );
  }

  function pickQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setAnswer(
      `Gợi ý trả lời: ${nextQuestion} nên được hiểu trong ngữ cảnh Module ${config.moduleName}. AI sẽ giúp giải thích khái niệm và câu hỏi kiểm tra, không kết luận cổ phiếu nên mua hay bán.`
    );
  }

  return (
    <div className="space-y-4">
      <AskAIInput value={question} onChange={setQuestion} onSubmit={submitQuestion} />

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Câu hỏi gợi ý</h3>
        <AITutorQuestionList questions={config.suggestedQuestions} onSelect={pickQuestion} />
      </section>

      <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 shadow-hard-sm">
        <h3 className="text-xs font-bold text-ink">AI phản hồi</h3>
        <p className="mt-2 text-xs leading-5 text-muted">{answer}</p>
        <div className="mt-3 grid gap-2">
          {["Giải thích dễ hơn", "Cho ví dụ", "Liên kết với module khác"].map((label) => (
            <button
              key={label}
              className="rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-left text-[11px] font-bold text-muted transition hover:border-border hover:bg-surface-hover hover:text-ink"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <AITutorSoftWarning>{config.softWarning}</AITutorSoftWarning>
    </div>
  );
}

function AITutorLearnTab({ config }: { config: AITutorConfig }) {
  return (
    <div className="space-y-3">
      {config.recommendedLessons.map((lesson) => (
        <AITutorRecommendedLessonCard key={lesson.title} lesson={lesson} />
      ))}
      <AITutorSoftWarning>
        Học nhanh giúp bạn hiểu phần đang phân tích, không thay thế việc kiểm chứng dữ liệu trong module.
      </AITutorSoftWarning>
    </div>
  );
}

function AITutorTabs({
  activeTab,
  onChange,
}: {
  activeTab: AITutorTab;
  onChange: (tab: AITutorTab) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-[4px] border border-border bg-surface-soft p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={cn(
            "rounded-[3px] px-2 py-2 text-[11px] font-bold transition",
            activeTab === tab.key
              ? "border border-border bg-ink text-white shadow-hard-sm"
              : "text-muted hover:bg-surface-hover hover:text-ink"
          )}
          type="button"
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AITutorPanelContent({
  activeModule,
  onNavigate,
}: RightAssistantPanelProps) {
  const config = useMemo(() => getTutorConfig(activeModule), [activeModule]);
  const [activeTab, setActiveTab] = useState<AITutorTab>("guide");

  return (
    <section key={activeModule} className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="border-b border-border-soft bg-surface-soft px-4 py-3">
        <p className="text-xs font-bold text-ink">AI Trợ giảng</p>
        <p className="mt-1 text-[11px] leading-4 text-muted">Hướng dẫn theo ngữ cảnh module hiện tại.</p>
      </div>
      <div className="space-y-4 px-4 py-4">
        <AITutorTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "guide" ? <AITutorGuideTab config={config} onNavigate={onNavigate} /> : null}
        {activeTab === "ask" ? <AITutorAskTab config={config} /> : null}
        {activeTab === "learn" ? <AITutorLearnTab config={config} /> : null}
      </div>
    </section>
  );
}

export function RightAssistantPanel({ activeModule, onNavigate }: RightAssistantPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      return !current;
    });
  }

  return (
    <>
      <aside
        className={cn(
          "hidden border-l-[1.5px] border-border bg-[#E7F1C8] px-4 py-6 md:block",
          isCollapsed ? "w-[64px]" : "w-[360px]"
        )}
      >
        <div className="sticky top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto pr-1">
          <button
            className="mb-3 w-full rounded-[3px] border-[1.5px] border-border bg-surface px-3 py-2 text-xs font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-surface-hover"
            type="button"
            onClick={toggleCollapsed}
          >
            {isCollapsed ? "AI" : "Thu gọn"}
          </button>
          {isCollapsed ? (
            <button
              className="grid min-h-[220px] w-full place-items-center rounded-[4px] border-[1.5px] border-border bg-surface text-xs font-bold text-ink shadow-soft [writing-mode:vertical-rl]"
              type="button"
              onClick={toggleCollapsed}
            >
              AI Trợ giảng
            </button>
          ) : (
            <AITutorPanelContent activeModule={activeModule} onNavigate={onNavigate} />
          )}
        </div>
      </aside>

      <button
        className="fixed bottom-20 right-4 z-40 rounded-[4px] border-[1.5px] border-border bg-accent px-4 py-3 text-xs font-bold text-ink shadow-hard md:hidden"
        type="button"
        onClick={() => setIsMobileOpen(true)}
      >
        Hỏi trợ giảng
      </button>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-ink/35"
            type="button"
            aria-label="Đóng AI Trợ giảng"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[8px] border-t-[1.5px] border-border bg-[#E7F1C8] px-4 py-4 shadow-hard">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">AI Trợ giảng</p>
                <p className="text-[11px] text-muted">Hướng dẫn theo module hiện tại.</p>
              </div>
              <button
                className="rounded-[3px] border-[1.5px] border-border bg-surface px-3 py-2 text-xs font-bold text-ink"
                type="button"
                onClick={() => setIsMobileOpen(false)}
              >
                Đóng
              </button>
            </div>
            <AITutorPanelContent activeModule={activeModule} onNavigate={onNavigate} />
          </div>
        </div>
      ) : null}
    </>
  );
}
