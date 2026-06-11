"use client";

import { useMemo, useState } from "react";
import { navigationItems } from "@/config/navigation.config";
import { shellConfig } from "@/config/shell.config";
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
  const [activeModule, setActiveModule] = useState(() => {
    if (typeof window === "undefined") {
      return shellConfig.defaultModuleKey;
    }

    const params = new URLSearchParams(window.location.search);
    const moduleFromUrl = params.get("module") ?? window.location.hash.replace("#", "");

    return moduleFromUrl && moduleKeys.has(moduleFromUrl)
      ? moduleFromUrl
      : shellConfig.defaultModuleKey;
  });

  function handleNavigate(nextModule: string) {
    if (nextModule === "route-config") {
      openDrawer();
      return;
    }

    if (!moduleKeys.has(nextModule)) {
      return;
    }

    setActiveModule(nextModule);

    const url = new URL(window.location.href);
    url.searchParams.set("module", nextModule);
    window.history.replaceState(null, "", url);
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
    <div className="grid min-h-dvh grid-cols-1 grid-rows-[56px_minmax(0,1fr)] bg-page md:grid-cols-[252px_minmax(0,1fr)_auto]">
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
        {activeModule === "learning" ? <LearningPage /> : null}
        {activeModule === "industry" ? <IndustryPage /> : null}
        {activeModule === "screening" ? <ScreeningPage /> : null}
        {activeModule === "business" ? <BusinessPage /> : null}
        {activeModule === "financials" ? <FinancialsPage /> : null}
        {activeModule === "valuation" ? <ValuationPage /> : null}
        {activeModule === "technical" ? <TechnicalPage /> : null}
        {activeModule === "risk" ? <RiskPage /> : null}
        {activeModule === "simulation" ? <SimulationPage /> : null}
        {activeModule === "watchlist" ? <WatchlistPage /> : null}
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
