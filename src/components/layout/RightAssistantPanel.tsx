"use client";

import { useMemo, useState } from "react";
import { aiTutorConfig, fallbackAITutorConfig, type AITutorConfig } from "@/config/aiTutor.config";
import { cn } from "@/lib/cn";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import { buildAssistantApiPayload } from "@/lib/ai-rag/context";
import {
  buildAssistantScreenContextPacket,
  readAssistantTickerFromSearch,
} from "./assistant-screen-context";

type AITutorTab = "guide" | "ask" | "learn";

type RightAssistantPanelProps = {
  activeModule: string;
  financialsRuntimeData?: FinancialsRuntimeData;
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

function renderInlineAnswerText(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function AssistantAnswerBlock({ answer }: { answer: string }) {
  const blocks = answer
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="mt-3 space-y-2 rounded-[3px] border border-border-soft bg-surface-soft px-3 py-2 text-xs leading-5 text-muted">
      {blocks.map((block, index) => {
        const headingMatch = block.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={`${block}-${index}`} className="font-bold text-ink">
              {renderInlineAnswerText(headingMatch[1] ?? "")}
            </p>
          );
        }

        const bulletMatch = block.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <p key={`${block}-${index}`} className="pl-3 before:mr-2 before:content-['•']">
              {renderInlineAnswerText(bulletMatch[1] ?? "")}
            </p>
          );
        }

        return <p key={`${block}-${index}`}>{renderInlineAnswerText(block)}</p>;
      })}
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
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-surface-soft px-3 py-3">
      <label className="grid gap-2">
        <span className="text-xs font-bold text-ink">Nhập câu hỏi</span>
        <textarea
          className="min-h-[84px] resize-none rounded-[3px] border border-border bg-surface px-3 py-2 text-xs leading-5 text-ink outline-none focus:bg-accent-soft/35"
          placeholder="Ví dụ: P/E thấp cần kiểm tra gì?"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button
        className="mt-3 rounded-[3px] border-[1.5px] border-border bg-accent px-3 py-2 text-xs font-bold text-ink shadow-hard-sm transition hover:-translate-y-0.5 hover:bg-[#DCA900] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        disabled={disabled}
        type="button"
        onClick={onSubmit}
      >
        Hỏi AI
      </button>
    </div>
  );
}

type AssistantApiDocument = {
  id: string;
  filePath: string;
  title?: string;
  purpose?: string;
  audience?: string;
};

type AssistantApiRetrievedChunk = {
  chunkId: string;
  documentId?: string;
  filePath: string;
  title?: string;
  sectionPath?: string[];
  sectionType?: string;
};

type AssistantApiViolation = {
  code: string;
  message?: string;
};

type AssistantApiRuntime = {
  selectedDocuments?: AssistantApiDocument[];
  retrievedChunks?: AssistantApiRetrievedChunk[];
  detectedIntent?: string;
  warnings?: string[];
  safetyLevel?: string;
  missingContext?: string[];
  debug?: {
    noLlmCall?: boolean;
    noApiCall?: boolean;
    selectedDocumentCount?: number;
  };
};

type AssistantApiResponse = {
  ok: boolean;
  runtime: AssistantApiRuntime | null;
  answer: string | null;
  llmStatus: "not_configured" | "completed" | "blocked_by_guardrails" | "provider_error" | string;
  message: string;
  violations?: AssistantApiViolation[];
  refusal?: string | null;
};

const documentLabels: Record<string, string> = {
  rag_knowledge_base: "Bản đồ tri thức RAG",
  rag_financial_terms: "Giải thích chỉ số tài chính",
  rag_valuation_knowledge: "Kiến thức định giá",
  rag_risk_knowledge: "Kiến thức rủi ro",
  rag_checklist_knowledge: "Checklist phân tích",
  rag_pvt_knowledge: "Price Volume Time",
  rag_financial_statements_guide: "Hướng dẫn đọc báo cáo tài chính",
  rag_document_template: "Mẫu tài liệu RAG",
  rag_metadata_standard: "Chuẩn metadata RAG",
  ai_guardrails: "Nguyên tắc an toàn AI",
  ai_rag_system_prompt: "Luật dùng RAG an toàn",
  ai_hallucination_checklist: "Checklist chống bịa dữ liệu",
};

const statusMessages: Record<string, string> = {
  not_configured: "AI chưa được cấu hình, hệ thống chỉ mới chuẩn bị ngữ cảnh.",
  completed: "AI đã trả lời và đã qua kiểm tra an toàn.",
  blocked_by_guardrails: "Câu trả lời bị chặn vì vi phạm nguyên tắc an toàn.",
  provider_error: "Nhà cung cấp AI gặp lỗi, hệ thống không hiển thị câu trả lời chưa kiểm chứng.",
};

const violationLabels: Record<string, string> = {
  BUY_SELL_HOLD_RECOMMENDATION: "Có dấu hiệu khuyến nghị mua, bán hoặc nắm giữ.",
  PRICE_PREDICTION: "Có dấu hiệu dự đoán giá hoặc hướng đi chắc chắn.",
  FAKE_FAIR_VALUE_OR_TARGET_PRICE: "Có dấu hiệu tự tạo fair value hoặc giá mục tiêu ngoài context.",
  MISSING_DATA_AS_ZERO: "Có dấu hiệu coi dữ liệu thiếu là 0.",
  FABRICATED_NUMERIC_DATA: "Có số liệu không nằm trong context được phép dùng.",
  INVALID_PE_INTERPRETATION: "Diễn giải P/E không an toàn khi EPS âm hoặc bằng 0.",
  INVALID_EQUITY_RATIO_INTERPRETATION: "Diễn giải ROE/P/B không an toàn khi vốn chủ hoặc BVPS không hợp lệ.",
  PVT_SIGNAL_WORDING: "Biến Price Volume Time thành tín hiệu giao dịch.",
  RISK_SCORE_OVERREACH: "Biến risk score thành kết luận cổ phiếu an toàn hoặc xấu.",
  CHECKLIST_RECOMMENDATION: "Biến checklist thành khuyến nghị đầu tư.",
  VALUATION_ACTION_LANGUAGE: "Có ngôn ngữ upside, downside hoặc khuyến nghị không được phép.",
  VALUATION_CONCLUSION: "Biến chỉ số định giá thành kết luận rẻ, đắt hoặc hấp dẫn.",
  MISSING_DATA_NOT_DISCLOSED: "Câu trả lời không nêu rõ dữ liệu đang thiếu.",
};

const getDocumentLabel = (document: AssistantApiDocument): string =>
  documentLabels[document.id] ?? document.title ?? "Tài liệu tham chiếu";

const getStatusMessage = (status?: string): string =>
  statusMessages[status ?? "not_configured"] ?? "Trạng thái AI chưa xác định, hệ thống không hiển thị câu trả lời chưa kiểm chứng.";

const getViolationLabel = (violation: AssistantApiViolation): string =>
  violationLabels[violation.code] ?? violation.message ?? "Câu trả lời không đạt kiểm tra an toàn.";

function AssistantEvidencePanel({
  runtimeResponse,
}: {
  runtimeResponse: AssistantApiResponse;
}) {
  const runtime = runtimeResponse.runtime;
  const selectedDocuments = runtime?.selectedDocuments ?? [];
  const retrievedChunkCount = runtime?.retrievedChunks?.length ?? 0;
  const warnings = runtime?.warnings ?? [];
  const violations = runtimeResponse.violations ?? [];

  return (
    <section className="rounded-[4px] border border-border-soft bg-surface-soft px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-ink">Minh bạch câu trả lời</h3>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            {getStatusMessage(runtimeResponse.llmStatus)}
          </p>
        </div>
        <span className="shrink-0 rounded-[3px] border border-border bg-surface px-2 py-1 text-[10px] font-bold text-muted">
          {runtimeResponse.llmStatus}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] leading-4 text-muted">
        <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
          <p className="font-bold text-ink">Cơ sở AI đang sử dụng</p>
          {selectedDocuments.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {selectedDocuments.slice(0, 5).map((document) => (
                <li key={document.id} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>
                    <span className="font-semibold text-ink">{getDocumentLabel(document)}</span>
                    {document.purpose ? <span className="block">{document.purpose}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">Chưa có tài liệu nào được chọn.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
            <p className="font-bold text-ink">Đoạn RAG tìm thấy</p>
            <p className="mt-1 text-sm font-bold text-ink">{retrievedChunkCount}</p>
          </div>
          <div className="rounded-[3px] border border-border-soft bg-surface px-3 py-2">
            <p className="font-bold text-ink">Mức an toàn</p>
            <p className="mt-1 text-sm font-bold text-ink">{runtime?.safetyLevel ?? "unknown"}</p>
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="rounded-[3px] border border-[#D6B15C] bg-[#FFF6D8] px-3 py-2 text-[#765416]">
            <p className="font-bold">Lưu ý khi trả lời</p>
            <ul className="mt-1 space-y-1">
              {warnings.slice(0, 4).map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {violations.length > 0 ? (
          <div className="rounded-[3px] border border-[#C05A4A] bg-[#FFF0EC] px-3 py-2 text-[#8A2E23]">
            <p className="font-bold">Lý do bị chặn</p>
            <ul className="mt-1 space-y-1">
              {violations.map((violation) => (
                <li key={`${violation.code}-${violation.message ?? ""}`}>
                  - {getViolationLabel(violation)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AITutorAskRuntimeTab({
  activeModule,
  config,
  financialsRuntimeData,
}: {
  activeModule: string;
  config: AITutorConfig;
  financialsRuntimeData?: FinancialsRuntimeData;
}) {
  const [question, setQuestion] = useState("");
  const [runtimeResponse, setRuntimeResponse] = useState<AssistantApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(
    "Chọn một câu hỏi gợi ý hoặc nhập câu hỏi. Runtime sẽ chuẩn bị prompt, chưa gọi LLM."
  );

  async function submitQuestion() {
    const trimmed = question.trim();

    if (!trimmed) {
      setRuntimeResponse(null);
      setError("Hãy nhập câu hỏi cụ thể hơn trước khi gọi AI runtime.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const contextPacket = buildAssistantScreenContextPacket({
        activeModule,
        ticker: readAssistantTickerFromSearch(window.location.search),
        financialsRuntimeData,
      });
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildAssistantApiPayload(trimmed, contextPacket)),
      });
      const payload = (await response.json()) as AssistantApiResponse;

      if (!response.ok || !payload.ok) {
        setRuntimeResponse(payload);
        setError(payload.message || "Không thể chuẩn bị AI runtime.");
        return;
      }

      setRuntimeResponse(payload);
    } catch {
      setRuntimeResponse(null);
      setError("Không thể gọi /api/assistant. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  function pickQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setRuntimeResponse(null);
    setError("Câu hỏi đã được điền. Bấm Hỏi AI để chuẩn bị runtime prompt.");
  }

  return (
    <div className="space-y-4">
      <AskAIInput value={question} onChange={setQuestion} onSubmit={submitQuestion} disabled={isLoading} />

      <section className="space-y-2">
        <h3 className="text-xs font-bold text-ink">Câu hỏi gợi ý</h3>
        <AITutorQuestionList questions={config.suggestedQuestions} onSelect={pickQuestion} />
      </section>

      <section className="rounded-[4px] border-[1.5px] border-border bg-surface px-3 py-3 shadow-hard-sm">
        <h3 className="text-xs font-bold text-ink">AI phản hồi</h3>
        <p className="mt-2 text-xs leading-5 text-muted">
          {isLoading
            ? "Đang gọi /api/assistant để chuẩn bị runtime prompt..."
            : runtimeResponse
              ? getStatusMessage(runtimeResponse.llmStatus)
              : error ??
                "AI runtime đã sẵn sàng prompt, nhưng LLM chưa được cấu hình. Lưu ý: AI chỉ giải thích dữ liệu, không đưa lời khuyên đầu tư."}
        </p>
        <p className="hidden">
          LLM status: {runtimeResponse?.llmStatus ?? "not_configured"} · Answer: {runtimeResponse?.answer ?? "null"}
        </p>

        {runtimeResponse?.answer ? (
          <AssistantAnswerBlock answer={runtimeResponse.answer} />
        ) : null}

        {runtimeResponse ? (
          <div className="mt-3">
            <AssistantEvidencePanel runtimeResponse={runtimeResponse} />
          </div>
        ) : null}

      </section>

      <AITutorSoftWarning>{config.softWarning}</AITutorSoftWarning>
      <AITutorSoftWarning>AI không đưa lời khuyên mua, bán hoặc nắm giữ. Nguồn dữ liệu AI đang dùng là dữ liệu nghiên cứu, chưa phê duyệt sản xuất.</AITutorSoftWarning>
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
  financialsRuntimeData,
  onNavigate,
}: RightAssistantPanelProps) {
  const config = useMemo(() => getTutorConfig(activeModule), [activeModule]);
  const [activeTab, setActiveTab] = useState<AITutorTab>("guide");

  return (
    <section key={activeModule} className="rounded-[4px] border-[1.5px] border-border bg-surface shadow-soft">
      <div className="border-b border-border-soft bg-surface-soft px-4 py-3">
        <p className="text-xs font-bold text-ink">AI Trợ giảng</p>
        <p className="mt-1 text-[11px] leading-4 text-muted">Hướng dẫn theo ngữ cảnh module hiện tại.</p>
        <div className="mt-2 rounded-[4px] border border-blue-200 bg-blue-50/50 p-2 text-[10px] leading-4 text-blue-900">
          <strong>Lưu ý:</strong> AI chỉ hỗ trợ giải thích dữ liệu và khái niệm, không đưa ra chỉ dẫn giao dịch hoặc dự đoán giá. Trợ lý hiện dùng ngữ cảnh có kiểm soát của hệ thống, chưa phải truy xuất ngữ nghĩa đầy đủ.
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <AITutorTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "guide" ? <AITutorGuideTab config={config} onNavigate={onNavigate} /> : null}
        {activeTab === "ask" ? (
          <AITutorAskRuntimeTab
            activeModule={activeModule}
            config={config}
            financialsRuntimeData={financialsRuntimeData}
          />
        ) : null}
        {activeTab === "learn" ? <AITutorLearnTab config={config} /> : null}
      </div>
    </section>
  );
}

export function RightAssistantPanel({
  activeModule,
  financialsRuntimeData,
  onNavigate,
}: RightAssistantPanelProps) {
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
            <AITutorPanelContent
              activeModule={activeModule}
              financialsRuntimeData={financialsRuntimeData}
              onNavigate={onNavigate}
            />
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
            <AITutorPanelContent
              activeModule={activeModule}
              financialsRuntimeData={financialsRuntimeData}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
