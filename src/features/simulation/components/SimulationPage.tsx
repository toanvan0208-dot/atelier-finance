"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { simulationExperienceData } from "../data/simulation.data";
import type {
  ClosedSimulatedPosition,
  PossibleScenario,
  SimulatedAccountSummary,
  SimulatedOrderSide,
  SimulatedPosition,
  SimulatedStockQuote,
  SimulationHistoryEvent,
  SimulationModeChoice,
  SimulationModeId,
} from "../types";
import { formatCurrency, getNowLabel } from "../utils";
import { ClosePositionDrawer } from "./ClosePositionDrawer";
import { PaperTradingDashboard } from "./PaperTradingDashboard";
import { PossibleScenariosPanel } from "./PossibleScenariosPanel";
import { SimulationTabs } from "./SimulationTabs";

type CloseDrawerState = {
  open: boolean;
  position?: SimulatedPosition;
};

type SimulationPersistentState = {
  activeMode: SimulationModeId;
  account: SimulatedAccountSummary;
  quotes: SimulatedStockQuote[];
  openPositions: SimulatedPosition[];
  closedPositions: ClosedSimulatedPosition[];
  historyEvents: SimulationHistoryEvent[];
  selectedStockSymbol?: string;
  selectedPositionId?: string;
  historicalCaseId: string;
  historicalDecision: string;
  historicalReason: string;
  historicalReflection: string;
  replayUnlocked: boolean;
};

type StateUpdate<T> = T | ((current: T) => T);

const simulationStorageKey = "atelier-finance.simulation.v1";
const enabledModes = ["current", "scenario"] satisfies SimulationModeId[];

function getVisibleSimulationModes(modes: SimulationModeChoice[]) {
  return modes.filter((mode) => (enabledModes as readonly SimulationModeId[]).includes(mode.id));
}

type PaperTradesApiBody = {
  ok?: boolean;
  data?: {
    closedPositions?: ClosedSimulatedPosition[];
    openPosition?: SimulatedPosition;
    openPositions?: SimulatedPosition[];
  };
};

type SimulationProfileApiBody = {
  ok?: boolean;
  data?: {
    cash?: number | null;
    totalCapital?: number | null;
    updatedAt?: string;
  } | null;
};

type SimulationJournalApiBody = {
  ok?: boolean;
  data?: SimulationHistoryEvent[];
};

type SimulationScenariosApiBody = {
  ok?: boolean;
  data?: PossibleScenario[];
};

type MarketBoardApiBody = {
  ok?: boolean;
  data?: SimulatedStockQuote[];
};

type NewSimulationScenarioPayload = {
  condition: string;
  impactOnPosition: string;
  paperTradeId?: string;
  signalsToWatch: string[];
  suggestedSimulationResponse: string;
  ticker: string;
  title: string;
};

function scenarioTypeForUi(value: string): PossibleScenario["type"] {
  const allowedTypes: PossibleScenario["type"][] = [
    "base",
    "behavior",
    "low_liquidity",
    "market_risk",
    "negative",
    "positive",
    "stop_loss",
    "target",
  ];
  return allowedTypes.includes(value as PossibleScenario["type"]) ? (value as PossibleScenario["type"]) : "base";
}

function normalizeScenario(scenario: PossibleScenario): PossibleScenario {
  return {
    ...scenario,
    type: scenarioTypeForUi(scenario.type),
  };
}

function isSimulationEventType(value: string): value is SimulationHistoryEvent["type"] {
  return [
    "note_added",
    "order_created",
    "position_closed",
    "position_opened",
    "scenario_reviewed",
    "stop_loss_updated",
    "target_updated",
  ].includes(value);
}

function normalizeJournalEvent(event: SimulationHistoryEvent): SimulationHistoryEvent {
  return {
    ...event,
    type: isSimulationEventType(event.type) ? event.type : "note_added",
  };
}

function persistSimulationJournal(event: Omit<SimulationHistoryEvent, "id" | "timestamp">): void {
  void fetch("/api/simulation/journal", {
    body: JSON.stringify({
      content: event.description,
      eventType: event.type,
      ticker: event.symbol,
      title: event.title,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

function patchSimulationProfile(account: Pick<SimulatedAccountSummary, "cash" | "totalCapital">): void {
  void fetch("/api/simulation/profile", {
    body: JSON.stringify({
      cash: account.cash,
      totalCapital: account.totalCapital,
    }),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  }).catch(() => undefined);
}

async function persistPaperTrade(position: SimulatedPosition): Promise<string | null> {
  const response = await fetch("/api/simulation/paper-trades", {
    body: JSON.stringify({
      entryPrice: position.averagePrice,
      quantity: position.quantity,
      thesisSnapshot: position.openReason,
      ticker: position.symbol,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) return null;

  const body = await response.json().catch(() => null) as PaperTradesApiBody | null;
  return body?.data?.openPosition?.id ?? null;
}

async function patchPaperTrade(
  id: string,
  data: {
    exitPrice?: number;
    quantity?: number;
    reflection?: string;
    status?: "closed";
    thesisSnapshot?: string;
  },
): Promise<void> {
  await fetch(`/api/simulation/paper-trades/${encodeURIComponent(id)}`, {
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  }).catch(() => undefined);
}

export function SimulationPage() {
  const data = simulationExperienceData;
  const visibleModes = getVisibleSimulationModes(data.modes);
  const [closeDrawer, setCloseDrawer] = useState<CloseDrawerState>({ open: false });
  const [scenarios, setScenarios] = useState<PossibleScenario[]>(data.paperTrading.scenarios);
  const [simulationState, setSimulationState] = useLocalStorageState<SimulationPersistentState>(
    simulationStorageKey,
    {
      activeMode: "current",
      account: data.paperTrading.account,
      quotes: [],
      openPositions: data.paperTrading.openPositions,
      closedPositions: data.paperTrading.closedPositions,
      historyEvents: data.paperTrading.historyEvents,
      selectedStockSymbol: data.paperTrading.quotes[0]?.symbol,
      selectedPositionId: data.paperTrading.openPositions[0]?.id,
      historicalCaseId: data.history.cases[0]?.id ?? "steel-cycle",
      historicalDecision: "",
      historicalReason: "",
      historicalReflection: "",
      replayUnlocked: false,
    }
  );
  const {
    account,
    activeMode,
    closedPositions,
    openPositions,
    quotes,
  } = simulationState;
  const visibleActiveMode = (enabledModes as readonly SimulationModeId[]).includes(activeMode) ? activeMode : "current";
  const selectedStock =
    quotes.find((quote) => quote.symbol === simulationState.selectedStockSymbol) ?? quotes[0];
  const selectedPosition =
    openPositions.find((position) => position.id === simulationState.selectedPositionId) ??
    openPositions.find((position) => position.symbol === selectedStock?.symbol);

  useEffect(() => {
    let cancelled = false;

    async function loadPaperTrades() {
      const response = await fetch("/api/simulation/paper-trades");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as PaperTradesApiBody | null;
      const nextOpenPositions = body?.data?.openPositions ?? [];
      const nextClosedPositions = body?.data?.closedPositions ?? [];
      if (cancelled || !body?.ok) return;

      setSimulationState((current) => ({
        ...current,
        closedPositions: nextClosedPositions,
        openPositions: nextOpenPositions.map((position) => ({
          ...position,
          weight: (position.marketValue / Math.max(current.account.totalCapital, 1)) * 100,
        })),
        quotes: current.quotes.map((quote) => ({
          ...quote,
          status: nextOpenPositions.some((position) => position.symbol === quote.symbol)
            ? "has_position"
            : quote.status === "has_position"
              ? "watching"
              : quote.status,
        })),
        selectedPositionId: nextOpenPositions[0]?.id ?? current.selectedPositionId,
        selectedStockSymbol: nextOpenPositions[0]?.symbol ?? current.selectedStockSymbol,
      }));
    }

    void loadPaperTrades();

    return () => {
      cancelled = true;
    };
  }, [setSimulationState]);

  useEffect(() => {
    let cancelled = false;

    async function loadMarketBoard() {
      setSimulationState((current) => ({ ...current, quotes: [] }));
      const response = await fetch("/api/simulation/market-board");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as MarketBoardApiBody | null;
      if (cancelled || !body?.ok || !Array.isArray(body.data)) return;
      const marketQuotes = body.data;

      setSimulationState((current) => {
        const openSymbols = new Set(current.openPositions.map((position) => position.symbol));
        const nextQuotes = marketQuotes.map((quote) => ({
          ...quote,
          status: openSymbols.has(quote.symbol) ? "has_position" as const : quote.status,
        }));
        const currentSelectionStillExists = nextQuotes.some((quote) => quote.symbol === current.selectedStockSymbol);

        return {
          ...current,
          quotes: nextQuotes,
          selectedStockSymbol: currentSelectionStillExists ? current.selectedStockSymbol : nextQuotes[0]?.symbol,
        };
      });
    }

    async function loadSimulationProfile() {
      const response = await fetch("/api/simulation/profile");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as SimulationProfileApiBody | null;
      const profile = body?.data;
      if (cancelled || !body?.ok || !profile) return;

      setSimulationState((current) => ({
        ...current,
        account: {
          ...current.account,
          cash: profile.cash ?? current.account.cash,
          totalCapital: profile.totalCapital ?? current.account.totalCapital,
          updatedAt: profile.updatedAt ? new Intl.DateTimeFormat("vi-VN").format(new Date(profile.updatedAt)) : current.account.updatedAt,
        },
      }));
    }

    async function loadSimulationJournal() {
      const response = await fetch("/api/simulation/journal");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as SimulationJournalApiBody | null;
      if (cancelled || !body?.ok || !Array.isArray(body.data) || body.data.length === 0) return;
      const entries = body.data;

      setSimulationState((current) => ({
        ...current,
        historyEvents: entries.map(normalizeJournalEvent),
      }));
    }

    async function loadSimulationScenarios() {
      const response = await fetch("/api/simulation/scenarios");
      if (!response.ok) return;

      const body = await response.json().catch(() => null) as SimulationScenariosApiBody | null;
      if (cancelled || !body?.ok || !Array.isArray(body.data)) return;

      setScenarios([...body.data.map(normalizeScenario), ...data.paperTrading.scenarios]);
    }

    void loadMarketBoard();
    void loadSimulationProfile();
    void loadSimulationJournal();
    void loadSimulationScenarios();

    return () => {
      cancelled = true;
    };
  }, [data.paperTrading.scenarios, setSimulationState]);

  function resolveStateUpdate<T>(current: T, update: StateUpdate<T>): T {
    return typeof update === "function" ? (update as (current: T) => T)(current) : update;
  }

  function setActiveMode(update: StateUpdate<SimulationModeId>) {
    setSimulationState((current) => ({
      ...current,
      activeMode: resolveStateUpdate(current.activeMode, update),
    }));
  }

  function setAccount(update: StateUpdate<SimulatedAccountSummary>) {
    setSimulationState((current) => ({
      ...current,
      account: resolveStateUpdate(current.account, update),
    }));
  }

  function setQuotes(update: StateUpdate<SimulatedStockQuote[]>) {
    setSimulationState((current) => ({
      ...current,
      quotes: resolveStateUpdate(current.quotes, update),
    }));
  }

  function setOpenPositions(update: StateUpdate<SimulatedPosition[]>) {
    setSimulationState((current) => ({
      ...current,
      openPositions: resolveStateUpdate(current.openPositions, update),
    }));
  }

  function setClosedPositions(update: StateUpdate<ClosedSimulatedPosition[]>) {
    setSimulationState((current) => ({
      ...current,
      closedPositions: resolveStateUpdate(current.closedPositions, update),
    }));
  }

  const recalculatedAccount = useMemo(
    () => {
      const positionValue = openPositions.reduce((total, position) => total + position.marketValue, 0);

      return {
        ...account,
        capitalUsagePercent: (positionValue / Math.max(account.totalCapital, 1)) * 100,
        positionValue,
        openPositions: openPositions.length,
        closedOrders: closedPositions.length,
      };
    },
    [account, closedPositions.length, openPositions]
  );

  function addHistoryEvent(event: Omit<SimulationHistoryEvent, "id" | "timestamp">) {
    persistSimulationJournal(event);
    setSimulationState((current) => ({
      ...current,
      historyEvents: [
        {
          ...event,
          id: `evt-${Date.now()}`,
          timestamp: getNowLabel(),
        },
        ...current.historyEvents,
      ],
    }));
  }

  function handleSelectStock(quote: SimulatedStockQuote) {
    const nextPosition = openPositions.find((position) => position.symbol === quote.symbol);
    setSimulationState((current) => ({
      ...current,
      selectedPositionId: nextPosition?.id,
      selectedStockSymbol: quote.symbol,
    }));
  }

  function handleCreateOrder(order: {
    side: SimulatedOrderSide;
    quantity: number;
    stopLoss?: number;
    target?: number;
    reason: string;
  }) {
    if (!selectedStock) return;

    if (order.side === "sell") {
      const existingPosition = openPositions.find((position) => position.symbol === selectedStock.symbol);
      if (existingPosition) {
        setCloseDrawer({ open: true, position: existingPosition });
      } else {
        addHistoryEvent({
          symbol: selectedStock.symbol,
          type: "order_created",
          title: `Tình huống giảm giả lập ${selectedStock.symbol} cần xem lại`,
          description: "Tình huống giảm giả lập yêu cầu đã có theo dõi trước đó. Hệ thống chỉ ghi lại để người dùng kiểm tra quy trình.",
        });
      }
      return;
    }

    const orderValue = selectedStock.price * order.quantity;
    const fee = orderValue * 0.0015;
    const totalCost = orderValue + fee;
    const currentDate = new Intl.DateTimeFormat("vi-VN").format(new Date());

    let positionToPersist: SimulatedPosition | null = null;
    let positionToPatch: SimulatedPosition | null = null;

    setOpenPositions((current) => {
      const existing = current.find((position) => position.symbol === selectedStock.symbol);
      if (!existing) {
        const marketValue = selectedStock.price * order.quantity;
        const newPosition: SimulatedPosition = {
          id: `pos-${selectedStock.symbol.toLowerCase()}-${Date.now()}`,
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          openedAt: currentDate,
          averagePrice: selectedStock.price,
          currentPrice: selectedStock.price,
          quantity: order.quantity,
          marketValue,
          weight: (marketValue / account.totalCapital) * 100,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          stopLoss: order.stopLoss,
          target: order.target,
          status: selectedStock.status === "low_liquidity" ? "low_liquidity" : "normal",
          openReason: order.reason,
        };
        positionToPersist = newPosition;
        setSimulationState((state) => ({ ...state, selectedPositionId: newPosition.id }));
        return [...current, newPosition];
      }

      const combinedQuantity = existing.quantity + order.quantity;
      const combinedCost = existing.averagePrice * existing.quantity + selectedStock.price * order.quantity;
      const averagePrice = combinedCost / combinedQuantity;
      const marketValue = selectedStock.price * combinedQuantity;
      const updated: SimulatedPosition = {
        ...existing,
        averagePrice,
        currentPrice: selectedStock.price,
        quantity: combinedQuantity,
        marketValue,
        weight: (marketValue / account.totalCapital) * 100,
        unrealizedPnL: (selectedStock.price - averagePrice) * combinedQuantity,
        unrealizedPnLPercent: ((selectedStock.price - averagePrice) / averagePrice) * 100,
        stopLoss: order.stopLoss ?? existing.stopLoss,
        target: order.target ?? existing.target,
        openReason: `${existing.openReason}; ${order.reason}`,
      };
      positionToPatch = updated;
      setSimulationState((state) => ({ ...state, selectedPositionId: updated.id }));
      return current.map((position) => (position.id === existing.id ? updated : position));
    });

    setAccount((current) => ({
      ...current,
      cash: current.cash - totalCost,
      capitalUsagePercent: ((current.totalCapital - (current.cash - totalCost)) / current.totalCapital) * 100,
      updatedAt: getNowLabel(),
    }));

    setQuotes((current) =>
      current.map((quote) => (quote.symbol === selectedStock.symbol ? { ...quote, status: "has_position" } : quote))
    );

    addHistoryEvent({
      symbol: selectedStock.symbol,
      type: "position_opened",
      title: `Tạo tình huống tăng giả lập ${selectedStock.symbol}`,
      description: `${formatCurrency(orderValue)} được ghi nhận trong không gian luyện tập. Lý do: ${order.reason}`,
    });

    const createdPosition = positionToPersist as SimulatedPosition | null;
    const updatedPosition = positionToPatch as SimulatedPosition | null;

    if (createdPosition) {
      void persistPaperTrade(createdPosition).then((persistedId) => {
        if (!persistedId || persistedId === createdPosition.id) return;
        setSimulationState((current) => ({
          ...current,
          openPositions: current.openPositions.map((position) =>
            position.id === createdPosition.id ? { ...position, id: persistedId } : position
          ),
          selectedPositionId: current.selectedPositionId === createdPosition.id ? persistedId : current.selectedPositionId,
        }));
      });
    }

    if (updatedPosition) {
      void patchPaperTrade(updatedPosition.id, {
        quantity: updatedPosition.quantity,
        thesisSnapshot: updatedPosition.openReason,
      });
    }
  }

  function handleClosePosition(position: SimulatedPosition) {
    setSimulationState((current) => ({
      ...current,
      selectedPositionId: position.id,
      selectedStockSymbol: position.symbol,
    }));
    setCloseDrawer({ open: true, position });
  }

  function handleConfirmClose(payload: {
    position: SimulatedPosition;
    closePrice: number;
    quantity: number;
    closeReason: string;
    lesson: string;
  }) {
    const { closePrice, closeReason, lesson, position, quantity } = payload;
    const closedQuantity = Math.min(quantity, position.quantity);
    const realizedPnL = (closePrice - position.averagePrice) * closedQuantity;
    const realizedPnLPercent = ((closePrice - position.averagePrice) / position.averagePrice) * 100;
    const currentDate = new Intl.DateTimeFormat("vi-VN").format(new Date());
    const closedValue = closePrice * closedQuantity;
    const feeAndTax = closedValue * 0.0025;

    const closed: ClosedSimulatedPosition = {
      id: `closed-${position.symbol.toLowerCase()}-${Date.now()}`,
      symbol: position.symbol,
      name: position.name,
      openedAt: position.openedAt,
      closedAt: currentDate,
      openPrice: position.averagePrice,
      closePrice,
      quantity: closedQuantity,
      realizedPnL,
      realizedPnLPercent,
      closeReason,
      lesson,
    };

    setClosedPositions((current) => [closed, ...current]);
    setOpenPositions((current) => {
      if (closedQuantity >= position.quantity) return current.filter((item) => item.id !== position.id);

      const remainingQuantity = position.quantity - closedQuantity;
      const remaining: SimulatedPosition = {
        ...position,
        quantity: remainingQuantity,
        marketValue: remainingQuantity * position.currentPrice,
        weight: ((remainingQuantity * position.currentPrice) / account.totalCapital) * 100,
        unrealizedPnL: (position.currentPrice - position.averagePrice) * remainingQuantity,
      };
      return current.map((item) => (item.id === position.id ? remaining : item));
    });
    setAccount((current) => ({
      ...current,
      cash: current.cash + closedValue - feeAndTax,
      realizedPnLPercent: ((current.realizedPnLPercent / 100) * current.totalCapital + realizedPnL) / current.totalCapital * 100,
      updatedAt: getNowLabel(),
    }));
    setQuotes((current) =>
      current.map((quote) => {
        if (quote.symbol !== position.symbol) return quote;
        return closedQuantity >= position.quantity ? { ...quote, status: "watching" } : quote;
      })
    );
    setCloseDrawer({ open: false });
    setSimulationState((current) => {
      const nextSelectedPosition = current.openPositions.find((item) => item.id === position.id);
      return {
        ...current,
        selectedPositionId: nextSelectedPosition?.id,
        selectedStockSymbol: position.symbol,
      };
    });
    addHistoryEvent({
      symbol: position.symbol,
      type: "position_closed",
      title: `Đóng theo dõi giả lập ${position.symbol}`,
      description: `Lý do đóng: ${closeReason}. Bài học: ${lesson}`,
    });
    if (closedQuantity >= position.quantity) {
      void patchPaperTrade(position.id, {
        exitPrice: closePrice,
        quantity: closedQuantity,
        reflection: lesson,
        status: "closed",
        thesisSnapshot: closeReason,
      });
    } else {
      void patchPaperTrade(position.id, {
        quantity: position.quantity - closedQuantity,
        thesisSnapshot: `${position.openReason}; ${closeReason}`,
      });
    }
  }

  function handleReviewScenario(position: SimulatedPosition) {
    setSimulationState((current) => ({
      ...current,
      activeMode: "scenario",
      selectedPositionId: position.id,
      selectedStockSymbol: position.symbol,
    }));
    addHistoryEvent({
      symbol: position.symbol,
      type: "scenario_reviewed",
      title: `Xem kịch bản ${position.symbol}`,
      description: "Người dùng chuyển sang tab Kịch bản có thể xảy ra để kiểm tra theo dõi giả lập.",
    });
  }

  function handleCreateScenario(payload: NewSimulationScenarioPayload) {
    const localScenario: PossibleScenario = {
      id: `scenario-${payload.ticker.toLowerCase()}-${Date.now()}`,
      condition: payload.condition,
      impactOnPosition: payload.impactOnPosition || "Cần theo dõi xem dữ liệu mới làm thesis mạnh hơn hay yếu đi.",
      relatedModules: ["Mô phỏng"],
      signalsToWatch: payload.signalsToWatch,
      suggestedSimulationResponse: payload.suggestedSimulationResponse || "Ghi lại kịch bản và kiểm tra lại khi dữ liệu mới xuất hiện.",
      symbol: payload.ticker,
      title: payload.title,
      type: "base",
    };

    setScenarios((current) => [localScenario, ...current]);
    addHistoryEvent({
      symbol: payload.ticker,
      type: "scenario_reviewed",
      title: `Tạo kịch bản riêng ${payload.ticker}`,
      description: payload.condition,
    });

    void fetch("/api/simulation/scenarios", {
      body: JSON.stringify({
        condition: payload.condition,
        impactOnPosition: payload.impactOnPosition,
        paperTradeId: payload.paperTradeId,
        relatedModules: ["Mô phỏng"],
        scenarioType: "base",
        signalsToWatch: payload.signalsToWatch,
        suggestedSimulationResponse: payload.suggestedSimulationResponse,
        ticker: payload.ticker,
        title: payload.title,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json().catch(() => null) as { data?: PossibleScenario } | null;
        const savedScenario = body?.data ? normalizeScenario(body.data) : null;
        if (!savedScenario) return;
        setScenarios((current) => current.map((scenario) => scenario.id === localScenario.id ? savedScenario : scenario));
      })
      .catch(() => undefined);
  }

  function handleUpdateStopLoss(position: SimulatedPosition) {
    const input = window.prompt("Nhập mốc cảnh báo giả lập mới", String(position.stopLoss ?? position.currentPrice));
    const nextStopLoss = Number(input);
    if (!input || Number.isNaN(nextStopLoss) || nextStopLoss <= 0) return;
    updatePosition(position.id, { stopLoss: nextStopLoss });
    addHistoryEvent({
      symbol: position.symbol,
      type: "stop_loss_updated",
      title: `Cập nhật mốc cảnh báo giả lập ${position.symbol}`,
      description: `Mốc cảnh báo giả lập mới: ${nextStopLoss.toLocaleString("vi-VN")}.`,
    });
  }

  function handleUpdateTarget(position: SimulatedPosition) {
    const input = window.prompt("Nhập mốc theo dõi giả lập mới", String(position.target ?? position.currentPrice));
    const nextTarget = Number(input);
    if (!input || Number.isNaN(nextTarget) || nextTarget <= 0) return;
    updatePosition(position.id, { target: nextTarget });
    addHistoryEvent({
      symbol: position.symbol,
      type: "target_updated",
      title: `Cập nhật mốc theo dõi giả lập ${position.symbol}`,
      description: `Mốc theo dõi giả lập mới: ${nextTarget.toLocaleString("vi-VN")}.`,
    });
  }

  function handleAddNote(position: SimulatedPosition) {
    const note = window.prompt("Ghi chú mô phỏng cho theo dõi này", position.openReason);
    if (!note?.trim()) return;
    updatePosition(position.id, { openReason: note });
    void patchPaperTrade(position.id, { thesisSnapshot: note });
    addHistoryEvent({
      symbol: position.symbol,
      type: "note_added",
      title: `Ghi chú mô phỏng ${position.symbol}`,
      description: note,
    });
  }

  function handleAddClosedLesson(position: ClosedSimulatedPosition) {
    const lesson = window.prompt("Ghi thêm bài học cho tình huống đã đóng", position.lesson);
    if (!lesson?.trim()) return;
    setClosedPositions((current) => current.map((item) => (item.id === position.id ? { ...item, lesson } : item)));
    void patchPaperTrade(position.id, { reflection: lesson });
  }

  function handleCustomizeAccount() {
    const totalCapitalInput = window.prompt("Nhập tổng vốn giả lập mới", String(account.totalCapital));
    if (!totalCapitalInput) return;
    const nextTotalCapital = Number(totalCapitalInput);
    if (Number.isNaN(nextTotalCapital) || nextTotalCapital <= 0) return;

    const cashInput = window.prompt("Nhập tiền mặt giả lập còn lại", String(account.cash));
    if (!cashInput) return;
    const nextCash = Number(cashInput);
    if (Number.isNaN(nextCash) || nextCash < 0) return;

    setAccount((current) => ({
      ...current,
      totalCapital: nextTotalCapital,
      cash: nextCash,
      capitalUsagePercent: ((nextTotalCapital - nextCash) / nextTotalCapital) * 100,
      updatedAt: getNowLabel(),
    }));
    patchSimulationProfile({ cash: nextCash, totalCapital: nextTotalCapital });

    addHistoryEvent({
      type: "note_added",
      title: "Tùy chỉnh không gian luyện tập",
      description: `Tổng vốn giả lập: ${formatCurrency(nextTotalCapital)}. Trọng số nhàn rỗi: ${formatCurrency(nextCash)}.`,
    });
  }

  function updatePosition(id: string, patch: Partial<SimulatedPosition>) {
    setOpenPositions((current) => {
      const updated = current.map((position) => (position.id === id ? { ...position, ...patch } : position));
      const nextSelected = updated.find((position) => position.id === id);
      if (nextSelected) {
        setSimulationState((state) => ({ ...state, selectedPositionId: nextSelected.id }));
      }
      return updated;
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <SimulationTabs modes={visibleModes} activeMode={visibleActiveMode} onSelect={setActiveMode} />

      {visibleActiveMode === "current" ? (
        <PaperTradingDashboard
          account={recalculatedAccount}
          closedPositions={closedPositions}
          historyEvents={simulationState.historyEvents}
          openPositions={openPositions}
          quotes={quotes}
          selectedStock={selectedStock}
          onAddClosedLesson={handleAddClosedLesson}
          onAddNote={handleAddNote}
          onClosePosition={handleClosePosition}
          onCreateOrder={handleCreateOrder}
          onCustomizeAccount={handleCustomizeAccount}
          onReviewScenario={handleReviewScenario}
          onSaveDraft={(reason) =>
            addHistoryEvent({
              symbol: selectedStock?.symbol,
              type: "order_created",
              title: "Lưu nháp tình huống mô phỏng",
              description: reason.trim() || "Người dùng lưu nháp tình huống mô phỏng nhưng chưa ghi lý do.",
            })
          }
          onSelectStock={handleSelectStock}
          onUpdateStopLoss={handleUpdateStopLoss}
          onUpdateTarget={handleUpdateTarget}
        />
      ) : null}

      {visibleActiveMode === "scenario" ? (
        <PossibleScenariosPanel
          openPositions={openPositions}
          scenarios={scenarios}
          selectedPosition={selectedPosition}
          selectedStock={selectedStock}
          onClosePosition={handleClosePosition}
          onCreateScenario={handleCreateScenario}
          onSelectStockFromPosition={(position) => {
            setSimulationState((current) => ({
              ...current,
              selectedPositionId: position.id,
              selectedStockSymbol: position.symbol,
            }));
          }}
          onUpdateStopLoss={handleUpdateStopLoss}
          onUpdateTarget={handleUpdateTarget}
        />
      ) : null}

      <SimulationDisclaimerCard />

      <ClosePositionDrawer
        open={closeDrawer.open}
        position={closeDrawer.position}
        onClose={() => setCloseDrawer({ open: false })}
        onConfirm={handleConfirmClose}
      />
    </div>
  );
}

function SimulationDisclaimerCard() {
  const data = simulationExperienceData;

  return (
    <Card>
      <CardHeader title={data.disclaimer.title} chip={<Chip variant="warning">Guardrail</Chip>} />
      <CardBody>
        <p className="text-sm leading-7 text-muted">{data.disclaimer.content}</p>
      </CardBody>
    </Card>
  );
}
