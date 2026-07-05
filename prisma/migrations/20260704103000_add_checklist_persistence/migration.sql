-- Add persistent checklist models described in the thesis design.
-- These tables store structured review progress without turning the result into investment advice.

CREATE TABLE "ChecklistItem" (
  "id" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "moduleKey" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "evidenceRule" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserChecklist" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "companyId" TEXT,
  "ticker" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "summary" TEXT,
  "readiness" "ReadinessStatus" NOT NULL DEFAULT 'needs_review',
  "contextSnapshot" TEXT NOT NULL DEFAULT '{}',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistResult" (
  "id" TEXT NOT NULL,
  "userChecklistId" TEXT NOT NULL,
  "checklistItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unanswered',
  "answer" TEXT,
  "evidenceSnapshot" TEXT NOT NULL DEFAULT '{}',
  "missingFields" TEXT NOT NULL DEFAULT '[]',
  "warningCodes" TEXT NOT NULL DEFAULT '[]',
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChecklistResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChecklistItem_itemCode_key" ON "ChecklistItem"("itemCode");
CREATE INDEX "ChecklistItem_moduleKey_isActive_idx" ON "ChecklistItem"("moduleKey", "isActive");
CREATE INDEX "ChecklistItem_displayOrder_idx" ON "ChecklistItem"("displayOrder");

CREATE INDEX "UserChecklist_userId_status_idx" ON "UserChecklist"("userId", "status");
CREATE INDEX "UserChecklist_companyId_idx" ON "UserChecklist"("companyId");
CREATE INDEX "UserChecklist_ticker_idx" ON "UserChecklist"("ticker");
CREATE INDEX "UserChecklist_readiness_idx" ON "UserChecklist"("readiness");

CREATE UNIQUE INDEX "ChecklistResult_userChecklistId_checklistItemId_key" ON "ChecklistResult"("userChecklistId", "checklistItemId");
CREATE INDEX "ChecklistResult_checklistItemId_idx" ON "ChecklistResult"("checklistItemId");
CREATE INDEX "ChecklistResult_status_idx" ON "ChecklistResult"("status");

ALTER TABLE "UserChecklist"
  ADD CONSTRAINT "UserChecklist_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserChecklist"
  ADD CONSTRAINT "UserChecklist_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistResult"
  ADD CONSTRAINT "ChecklistResult_userChecklistId_fkey"
  FOREIGN KEY ("userChecklistId") REFERENCES "UserChecklist"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChecklistResult"
  ADD CONSTRAINT "ChecklistResult_checklistItemId_fkey"
  FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
