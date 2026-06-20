"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { navigationItems } from "@/config/navigation.config";
import { shellConfig } from "@/config/shell.config";
import { SurveyModeBanner } from "@/components/layout/SurveyModeBanner";
import { BusinessPage } from "@/features/business";
import { ChecklistPage } from "@/features/checklist";
import { FinancialsPage } from "@/features/financials";
import { IndustryPage } from "@/features/industry";
import { LearningPage } from "@/features/learning";
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
import { WatchlistPage } from "@/features/watchlist";
import { MainContent } from "./MainContent";
import { MobileNavigation } from "./MobileNavigation";
import { RightAssistantPanel } from "./RightAssistantPanel";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { resolveActiveModule, shouldNormalizeInvalidModule } from "./app-shell-routing";

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

export function AppShell() {
  return (
    <PersonalAnalysisProfileProvider>
      <AppShellContent />
    </PersonalAnalysisProfileProvider>
  );
}

function AppShellContent() {
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

      const params = new URLSearchParams(window.location.search);
      return params.get("module") ?? window.location.hash.replace("#", "") ?? null;
    },
    () => null
  );
  const activeModule = resolveActiveModule(moduleFromUrl, moduleKeys, shellConfig.defaultModuleKey);
  const isSurveyMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("survey") === "1";

  useEffect(() => {
    if (!shouldNormalizeInvalidModule(moduleFromUrl, moduleKeys)) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("module", shellConfig.defaultModuleKey);
    url.hash = "";
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
  }, [moduleFromUrl, moduleKeys]);

  function handleNavigate(nextModule: string) {
    if (nextModule === "route-config") {
      openDrawer();
      return;
    }

    if (!moduleKeys.has(nextModule)) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("module", nextModule);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(navigationChangeEvent));
  }

  const activeItem = useMemo(
    () =>
      navigationItems.find((item) => item.key === activeModule) ??
      navigationItems[0],
    [activeModule]
  );
  const activeJourney =
    shellConfig.moduleJourney[
      activeModule as keyof typeof shellConfig.moduleJourney
    ];

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
        activeLabel={activeItem.label}
        description={shellConfig.mainContent.description}
        kicker={shellConfig.mainContent.kicker}
        status={shellConfig.mainContent.status}
        title={shellConfig.mainContent.title}
        surveyBanner={<SurveyModeBanner isVisible={isSurveyMode} />}
        journey={
          modulesWithInternalProgress.has(activeModule) ? undefined : activeJourney
        }
      >
        {activeModule === "overview" ? (
          <OverviewPage onNavigate={handleNavigate} />
        ) : null}
        {activeModule === "macro" ? (
          <MacroPage onNavigate={handleNavigate} />
        ) : null}
        {activeModule === "learning" ? <LearningPage onNavigate={handleNavigate} /> : null}
        {activeModule === "industry" ? <IndustryPage onNavigate={handleNavigate} /> : null}
        {activeModule === "screening" ? <ScreeningPage onNavigate={handleNavigate} /> : null}
        {activeModule === "business" ? (
          <BusinessPage onNavigate={handleNavigate} />
        ) : null}
        {activeModule === "financials" ? <FinancialsPage onNavigate={handleNavigate} /> : null}
        {activeModule === "valuation" ? <ValuationPage onNavigate={handleNavigate} /> : null}
        {activeModule === "technical" ? <TechnicalPage onNavigate={handleNavigate} /> : null}
        {activeModule === "risk" ? <RiskPage onNavigate={handleNavigate} /> : null}
        {activeModule === "simulation" ? <SimulationPage /> : null}
        {activeModule === "watchlist" ? <WatchlistPage onNavigate={handleNavigate} /> : null}
        {activeModule === "checklist" ? (
          <ChecklistPage onNavigate={handleNavigate} />
        ) : null}
      </MainContent>
      <RightAssistantPanel
        activeModule={activeModule}
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
