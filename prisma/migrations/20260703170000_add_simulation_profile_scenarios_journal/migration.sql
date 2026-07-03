-- Phase: user-scoped simulation persistence
-- Adds dedicated storage for account profile, scenario cards, and simulation journal.

CREATE TABLE "SimulationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalCapital" DECIMAL(65,30),
    "cash" DECIMAL(65,30),
    "riskBudgetPercent" DECIMAL(65,30),
    "notes" TEXT,
    "dataMode" "DataMode" NOT NULL DEFAULT 'user_input',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperTradeId" TEXT,
    "companyId" TEXT,
    "ticker" TEXT,
    "scenarioType" TEXT NOT NULL DEFAULT 'base',
    "title" TEXT NOT NULL,
    "condition" TEXT,
    "signalsToWatch" TEXT NOT NULL DEFAULT '[]',
    "impactOnPosition" TEXT,
    "suggestedSimulationResponse" TEXT,
    "relatedModules" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dataMode" "DataMode" NOT NULL DEFAULT 'user_input',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SimulationJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperTradeId" TEXT,
    "companyId" TEXT,
    "ticker" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "dataMode" "DataMode" NOT NULL DEFAULT 'user_input',
    "readiness" "ReadinessStatus" NOT NULL DEFAULT 'needs_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationJournal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SimulationProfile_userId_key" ON "SimulationProfile"("userId");
CREATE INDEX "SimulationProfile_dataMode_idx" ON "SimulationProfile"("dataMode");
CREATE INDEX "SimulationProfile_readiness_idx" ON "SimulationProfile"("readiness");

CREATE INDEX "SimulationScenario_userId_status_idx" ON "SimulationScenario"("userId", "status");
CREATE INDEX "SimulationScenario_paperTradeId_idx" ON "SimulationScenario"("paperTradeId");
CREATE INDEX "SimulationScenario_companyId_idx" ON "SimulationScenario"("companyId");
CREATE INDEX "SimulationScenario_ticker_idx" ON "SimulationScenario"("ticker");
CREATE INDEX "SimulationScenario_dataMode_idx" ON "SimulationScenario"("dataMode");

CREATE INDEX "SimulationJournal_userId_createdAt_idx" ON "SimulationJournal"("userId", "createdAt");
CREATE INDEX "SimulationJournal_paperTradeId_idx" ON "SimulationJournal"("paperTradeId");
CREATE INDEX "SimulationJournal_companyId_idx" ON "SimulationJournal"("companyId");
CREATE INDEX "SimulationJournal_ticker_idx" ON "SimulationJournal"("ticker");
CREATE INDEX "SimulationJournal_eventType_idx" ON "SimulationJournal"("eventType");

ALTER TABLE "SimulationProfile" ADD CONSTRAINT "SimulationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_paperTradeId_fkey" FOREIGN KEY ("paperTradeId") REFERENCES "PaperTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SimulationJournal" ADD CONSTRAINT "SimulationJournal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimulationJournal" ADD CONSTRAINT "SimulationJournal_paperTradeId_fkey" FOREIGN KEY ("paperTradeId") REFERENCES "PaperTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SimulationJournal" ADD CONSTRAINT "SimulationJournal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
