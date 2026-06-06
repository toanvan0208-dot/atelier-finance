"use client";

import { useMemo, useState } from "react";
import { navigationItems } from "@/config/navigation.config";
import { shellConfig } from "@/config/shell.config";
import { BusinessPage } from "@/features/business";
import { FinancialsPage } from "@/features/financials";
import { IndustryPage } from "@/features/industry";
import { MacroPage } from "@/features/macro";
import { ScreeningPage } from "@/features/screening";
import { ValuationPage } from "@/features/valuation";
import { MainContent } from "./MainContent";
import { MobileNavigation } from "./MobileNavigation";
import { RightAssistantPanel } from "./RightAssistantPanel";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const [activeModule, setActiveModule] = useState(shellConfig.defaultModuleKey);

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
    <div className="grid min-h-dvh grid-cols-1 grid-rows-[56px_minmax(0,1fr)] bg-page md:grid-cols-[252px_minmax(0,1fr)_360px]">
      <Topbar
        actions={shellConfig.topbarActions}
        brandName={shellConfig.brandName}
        title={shellConfig.title}
      />
      <Sidebar
        activeKey={activeModule}
        description={shellConfig.journey.description}
        items={navigationItems}
        kicker={shellConfig.journey.kicker}
        onNavigate={setActiveModule}
      />
      <MainContent
        activeLabel={activeItem.label}
        description={shellConfig.mainContent.description}
        kicker={shellConfig.mainContent.kicker}
        status={shellConfig.mainContent.status}
        title={shellConfig.mainContent.title}
        journey={activeJourney}
      >
        {activeModule === "macro" ? <MacroPage /> : null}
        {activeModule === "industry" ? <IndustryPage /> : null}
        {activeModule === "screening" ? <ScreeningPage /> : null}
        {activeModule === "business" ? <BusinessPage /> : null}
        {activeModule === "financials" ? <FinancialsPage /> : null}
        {activeModule === "valuation" ? <ValuationPage /> : null}
      </MainContent>
      <RightAssistantPanel
        activeLabel={activeItem.label}
        messages={shellConfig.assistant.messages}
        title={shellConfig.assistant.title}
      />
      <MobileNavigation
        items={navigationItems}
        activeKey={activeModule}
        onNavigate={setActiveModule}
      />
    </div>
  );
}
