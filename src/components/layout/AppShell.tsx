"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { navigationItems } from "@/config/navigation.config";
import { shellConfig } from "@/config/shell.config";
import { BusinessPage } from "@/features/business";
import { ChecklistPage } from "@/features/checklist";
import { FinancialsPage } from "@/features/financials/components/FinancialsPage";
import { IndustryPage } from "@/features/industry";
import { LearningPage, type LearningRuntimeData } from "@/features/learning";
import { MacroPage } from "@/features/macro";
import { OverviewPage } from "@/features/overview";
import {
  PersonalAnalysisProfileButton,
  PersonalAnalysisProfileDrawer,
  PersonalAnalysisProfileProvider,
  usePersonalAnalysisProfile,
} from "@/features/personal-analysis-profile";
import { RiskPage } from "@/features/risk";
import { ScreeningPage } from "@/features/screening";
import { SimulationPage } from "@/features/simulation";
import { TechnicalPage } from "@/features/technical";
import { ValuationPage } from "@/features/valuation";
import type { ValuationUnitAwareReadyMetricsScenarioId } from "@/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario";
import { WatchlistPage } from "@/features/watchlist";
import { MainContent } from "./MainContent";
import { MobileNavigation } from "./MobileNavigation";
import { RightAssistantPanel } from "./RightAssistantPanel";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import {
  buildModuleNavigationUrl,
  readModuleFromLocation,
  resolveActiveModule,
  shouldNormalizeInvalidModule,
} from "./app-shell-routing";
import type { FinancialsRuntimeData } from "@/features/financials/lib/financials-runtime-types";
import type { TechnicalPageRuntimeData } from "@/features/technical";
import type {
  PortfolioReadinessItem,
  PortfolioReadinessResult,
} from "@/features/watchlist/lib/load-portfolio-readiness";
import type { CheckThinkingData } from "@/features/checklist/types";
import type { ScreeningRuntimeData } from "@/features/screening";
import type { MacroCompassData } from "@/features/macro/types";
import type { IndustryContextRuntimePayload } from "@/features/industry/lib/load-industry-context";
import { PRODUCT_MODULE_GATES } from "@/lib/product/module-readiness";
import type { AuthUser } from "@/lib/auth/session";

const modulesWithInternalProgress = new Set([
  "macro",
  "learning",
  "business",
  "financials",
  "valuation",
  "technical",
  "risk",
  "simulation",
  "overview",
  "screening",
]);

const navigationChangeEvent = "app:navigation";

type AppShellProps = {
  currentUser?: AuthUser | null;
  initialFinancialsRuntimeData?: FinancialsRuntimeData;
  initialModule?: string | null;
  initialPortfolioReadiness?: PortfolioReadinessResult;
  initialTechnicalData?: TechnicalPageRuntimeData;
  initialValuationScenario?: ValuationUnitAwareReadyMetricsScenarioId | null;
  initialChecklistData?: CheckThinkingData;
  initialScreeningData?: ScreeningRuntimeData;
  initialLearningData?: LearningRuntimeData;
  initialMacroData?: MacroCompassData;
  initialIndustryContexts?: Record<string, IndustryContextRuntimePayload>;
};

export function AppShell({
  currentUser,
  initialFinancialsRuntimeData,
  initialModule,
  initialPortfolioReadiness,
  initialTechnicalData,
  initialValuationScenario,
  initialChecklistData,
  initialScreeningData,
  initialLearningData,
  initialMacroData,
  initialIndustryContexts,
}: AppShellProps) {
  return (
    <PersonalAnalysisProfileProvider>
      <AppShellContent
        currentUser={currentUser}
        initialChecklistData={initialChecklistData}
        initialFinancialsRuntimeData={initialFinancialsRuntimeData}
        initialModule={initialModule}
        initialPortfolioReadiness={initialPortfolioReadiness}
        initialTechnicalData={initialTechnicalData}
        initialValuationScenario={initialValuationScenario}
        initialScreeningData={initialScreeningData}
        initialLearningData={initialLearningData}
        initialMacroData={initialMacroData}
        initialIndustryContexts={initialIndustryContexts}
      />
    </PersonalAnalysisProfileProvider>
  );
}

function AppShellContent({
  currentUser,
  initialFinancialsRuntimeData,
  initialModule,
  initialPortfolioReadiness,
  initialTechnicalData,
  initialValuationScenario,
  initialChecklistData,
  initialScreeningData,
  initialLearningData,
  initialMacroData,
  initialIndustryContexts,
}: AppShellProps) {
  const { openDrawer } = usePersonalAnalysisProfile();
  const moduleKeys = useMemo(
    () => new Set(navigationItems.map((item) => item.key)),
    []
  );
  const moduleFromUrl = useSyncExternalStore(
    (callback) => {
      const timeoutId = window.setTimeout(callback, 0);
      window.addEventListener("popstate", callback);
      window.addEventListener(navigationChangeEvent, callback);

      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("popstate", callback);
        window.removeEventListener(navigationChangeEvent, callback);
      };
    },
    () => {
      if (typeof window === "undefined") return null;

      return readModuleFromLocation(window.location.search, window.location.hash);
    },
    () => initialModule ?? null
  );
  const activeModule = resolveActiveModule(moduleFromUrl, moduleKeys, shellConfig.defaultModuleKey);

  useEffect(() => {
    if (!shouldNormalizeInvalidModule(moduleFromUrl, moduleKeys)) {
      return;
    }

    const url = buildModuleNavigationUrl(window.location.href, shellConfig.defaultModuleKey);
    url.hash = "";
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
  }, [moduleFromUrl, moduleKeys]);

  function handleNavigate(nextModule: string, params?: { ticker?: string }) {
    if (nextModule === "route-config") {
      openDrawer();
      return;
    }

    if (!moduleKeys.has(nextModule)) {
      return;
    }

    const url = buildModuleNavigationUrl(window.location.href, nextModule, params);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
  }

  const activeItem = useMemo(
    () =>
      navigationItems.find((item) => item.key === activeModule) ??
      navigationItems[0] ?? { key: activeModule, label: activeModule },
    [activeModule]
  );
  
  const activeGate = PRODUCT_MODULE_GATES[activeModule];
  const isGated = activeGate?.readiness === "gated_not_real_yet";
  const activeJourney =
    shellConfig.moduleJourney[
      activeModule as keyof typeof shellConfig.moduleJourney
    ];
  const activePortfolioReadiness: PortfolioReadinessItem | null =
    initialPortfolioReadiness?.tickers.find(
      (item) => item.ticker === initialFinancialsRuntimeData?.source.ticker,
    ) ?? null;

  return (
    <div
      className="grid min-h-dvh grid-cols-1 grid-rows-[56px_minmax(0,1fr)] bg-page md:grid-cols-[252px_minmax(0,1fr)_auto]"
      data-active-module={activeModule}
      data-testid="app-shell"
    >
      <Topbar
        actions={shellConfig.topbarActions}
        brandName={shellConfig.brandName}
        profileAction={<PersonalAnalysisProfileButton />}
        title={shellConfig.title}
      />
      <PersonalAnalysisProfileButton placement="floating" />
      <PersonalAnalysisProfileDrawer />
      <Sidebar
        activeKey={activeModule}
        description={shellConfig.journey.description}
        items={navigationItems}
        kicker={shellConfig.journey.kicker}
        onNavigate={handleNavigate}
      />
      <MainContent
        activeLabel={isGated ? activeGate.userFacingLabel : activeItem.label}
        description={isGated ? activeGate.reason : shellConfig.mainContent.description}
        kicker={isGated ? "Tính năng chưa khả dụng" : shellConfig.mainContent.kicker}
        status={isGated ? "CHƯA KHẢ DỤNG" : shellConfig.mainContent.status}
        title={isGated ? "Gated Feature" : shellConfig.mainContent.title}
        journey={
          modulesWithInternalProgress.has(activeModule) ? undefined : activeJourney
        }
      >
        {isGated ? null : activeModule === "overview" ? (
          <OverviewPage
            currentUser={currentUser}
            initialFinancialsRuntimeData={initialFinancialsRuntimeData}
            portfolioReadiness={initialPortfolioReadiness}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "macro" ? (
          <MacroPage onNavigate={handleNavigate} initialData={initialMacroData} />
        ) : null}
        {activeModule === "learning" && initialLearningData ? <LearningPage onNavigate={handleNavigate} initialData={initialLearningData} /> : null}
        {activeModule === "industry" ? (
          <IndustryPage
            initialIndustryContexts={initialIndustryContexts}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "screening" ? <ScreeningPage onNavigate={handleNavigate} initialData={initialScreeningData} /> : null}
        {activeModule === "business" ? (
          <BusinessPage onNavigate={handleNavigate} />
        ) : null}
        {activeModule === "financials" ? (
          <FinancialsPage
            initialRuntimeData={initialFinancialsRuntimeData}
            reviewedReadiness={activePortfolioReadiness}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "valuation" ? (
          <ValuationPage
            initialFinancialsRuntimeData={initialFinancialsRuntimeData}
            initialScenario={initialValuationScenario}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "technical" ? (
          <TechnicalPage
            initialRuntimeData={initialTechnicalData}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "risk" ? (
          <RiskPage
            initialFinancialsRuntimeData={initialFinancialsRuntimeData}
            onNavigate={handleNavigate}
          />
        ) : null}
        {activeModule === "simulation" ? <SimulationPage /> : null}
        {activeModule === "watchlist" ? (
          <WatchlistPage
            onNavigate={handleNavigate}
            portfolioReadiness={initialPortfolioReadiness}
          />
        ) : null}
        {activeModule === "checklist" ? (
          <ChecklistPage onNavigate={handleNavigate} initialChecklistData={initialChecklistData} />
        ) : null}
      </MainContent>
      <RightAssistantPanel
        activeModule={activeModule}
        financialsRuntimeData={initialFinancialsRuntimeData}
        onNavigate={handleNavigate}
      />
      <MobileNavigation
        items={navigationItems}
        activeKey={activeModule}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
