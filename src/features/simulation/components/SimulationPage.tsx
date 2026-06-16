"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip } from "@/components/ui";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { simulationExperienceData } from "../data/simulation.data";
import type {
  ClosedSimulatedPosition,
  SimulatedAccountSummary,
  SimulatedOrderSide,
  SimulatedPosition,
  SimulatedStockQuote,
  SimulationHistoryEvent,
  SimulationModeId,
} from "../types";
import { formatCurrency, getNowLabel } from "../utils";
import { ClosePositionDrawer } from "./ClosePositionDrawer";
import { HistoricalCaseWorkspace } from "./HistoricalCaseWorkspace";
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

export function SimulationPage() {
  const data = simulationExperienceData;
  const [closeDrawer, setCloseDrawer] = useState<CloseDrawerState>({ open: false });
  const [simulationState, setSimulationState] = useLocalStorageState<SimulationPersistentState>(
    simulationStorageKey,
    {
      activeMode: "current",
      account: data.paperTrading.account,
      quotes: data.paperTrading.quotes,
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
    historicalCaseId,
    historicalDecision,
    historicalReason,
    historicalReflection,
    openPositions,
    quotes,
    replayUnlocked,
  } = simulationState;
  const selectedStock =
    quotes.find((quote) => quote.symbol === simulationState.selectedStockSymbol) ?? quotes[0];
  const selectedPosition =
    openPositions.find((position) => position.id === simulationState.selectedPositionId) ??
    openPositions.find((position) => position.symbol === selectedStock?.symbol);

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

  function setHistoricalCaseId(historicalCaseId: string) {
    setSimulationState((current) => ({ ...current, historicalCaseId }));
  }

  function setHistoricalDecision(historicalDecision: string) {
    setSimulationState((current) => ({ ...current, historicalDecision }));
  }

  function setHistoricalReason(historicalReason: string) {
    setSimulationState((current) => ({ ...current, historicalReason }));
  }

  function setHistoricalReflection(historicalReflection: string) {
    setSimulationState((current) => ({ ...current, historicalReflection }));
  }

  function setReplayUnlocked(replayUnlocked: boolean) {
    setSimulationState((current) => ({ ...current, replayUnlocked }));
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
          title: `Lệnh bán giả lập ${selectedStock.symbol} cần xem lại`,
          description: "Lệnh bán giả lập yêu cầu đã có vị thế trước đó. Hệ thống chỉ ghi lại để người dùng kiểm tra quy trình.",
        });
      }
      return;
    }

    const orderValue = selectedStock.price * order.quantity;
    const fee = orderValue * 0.0015;
    const totalCost = orderValue + fee;
    const currentDate = new Intl.DateTimeFormat("vi-VN").format(new Date());

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
      title: `Tạo lệnh mua giả lập ${selectedStock.symbol}`,
      description: `${formatCurrency(orderValue)} được ghi nhận trong tài khoản giả lập. Lý do: ${order.reason}`,
    });
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
      title: `Đóng vị thế giả lập ${position.symbol}`,
      description: `Lý do đóng: ${closeReason}. Bài học: ${lesson}`,
    });
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
      description: "Người dùng chuyển sang tab Kịch bản có thể xảy ra để kiểm tra vị thế giả lập.",
    });
  }

  function handleUpdateStopLoss(position: SimulatedPosition) {
    const input = window.prompt("Nhập stop-loss giả lập mới", String(position.stopLoss ?? position.currentPrice));
    const nextStopLoss = Number(input);
    if (!input || Number.isNaN(nextStopLoss) || nextStopLoss <= 0) return;
    updatePosition(position.id, { stopLoss: nextStopLoss });
    addHistoryEvent({
      symbol: position.symbol,
      type: "stop_loss_updated",
      title: `Cập nhật stop-loss giả lập ${position.symbol}`,
      description: `Stop-loss giả lập mới: ${nextStopLoss.toLocaleString("vi-VN")}.`,
    });
  }

  function handleUpdateTarget(position: SimulatedPosition) {
    const input = window.prompt("Nhập target giả lập mới", String(position.target ?? position.currentPrice));
    const nextTarget = Number(input);
    if (!input || Number.isNaN(nextTarget) || nextTarget <= 0) return;
    updatePosition(position.id, { target: nextTarget });
    addHistoryEvent({
      symbol: position.symbol,
      type: "target_updated",
      title: `Cập nhật target giả lập ${position.symbol}`,
      description: `Target giả lập mới: ${nextTarget.toLocaleString("vi-VN")}.`,
    });
  }

  function handleAddNote(position: SimulatedPosition) {
    const note = window.prompt("Ghi chú mô phỏng cho vị thế này", position.openReason);
    if (!note?.trim()) return;
    updatePosition(position.id, { openReason: note });
    addHistoryEvent({
      symbol: position.symbol,
      type: "note_added",
      title: `Ghi chú mô phỏng ${position.symbol}`,
      description: note,
    });
  }

  function handleAddClosedLesson(position: ClosedSimulatedPosition) {
    const lesson = window.prompt("Ghi thêm bài học cho lệnh đã đóng", position.lesson);
    if (!lesson?.trim()) return;
    setClosedPositions((current) => current.map((item) => (item.id === position.id ? { ...item, lesson } : item)));
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

    addHistoryEvent({
      type: "note_added",
      title: "Tùy chỉnh tài khoản giả lập",
      description: `Tổng vốn giả lập: ${formatCurrency(nextTotalCapital)}. Tiền mặt còn lại: ${formatCurrency(nextCash)}.`,
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
      <SimulationTabs modes={data.modes} activeMode={activeMode} onSelect={setActiveMode} />

      {activeMode === "current" ? (
        <PaperTradingDashboard
          account={recalculatedAccount}
          closedPositions={closedPositions}
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
              title: "Lưu nháp lệnh mô phỏng",
              description: reason.trim() || "Người dùng lưu nháp lệnh mô phỏng nhưng chưa ghi lý do.",
            })
          }
          onSelectStock={handleSelectStock}
          onUpdateStopLoss={handleUpdateStopLoss}
          onUpdateTarget={handleUpdateTarget}
        />
      ) : null}

      {activeMode === "scenario" ? (
        <PossibleScenariosPanel
          openPositions={openPositions}
          scenarios={data.paperTrading.scenarios}
          selectedPosition={selectedPosition}
          selectedStock={selectedStock}
          onClosePosition={handleClosePosition}
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

      {activeMode === "history" ? (
        <HistoricalCaseWorkspace
          data={data.history}
          decision={historicalDecision}
          reason={historicalReason}
          reflection={historicalReflection}
          replayUnlocked={replayUnlocked}
          selectedCaseId={historicalCaseId}
          onCaseChange={(id) => {
            setHistoricalCaseId(id);
            setReplayUnlocked(false);
          }}
          onDecisionChange={setHistoricalDecision}
          onReasonChange={setHistoricalReason}
          onReflectionChange={setHistoricalReflection}
          onUnlockReplay={() => setReplayUnlocked(true)}
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
