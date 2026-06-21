-- CreateTable
CREATE TABLE "FinancialStatementUnitMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "financialStatementId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "dataMode" TEXT,
    "warningCodes" TEXT NOT NULL DEFAULT '[]',
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialStatementUnitMetadata_financialStatementId_fkey" FOREIGN KEY ("financialStatementId") REFERENCES "FinancialStatement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatementUnitMetadata_financialStatementId_field_key" ON "FinancialStatementUnitMetadata"("financialStatementId", "field");

-- CreateIndex
CREATE INDEX "FinancialStatementUnitMetadata_financialStatementId_idx" ON "FinancialStatementUnitMetadata"("financialStatementId");

-- CreateIndex
CREATE INDEX "FinancialStatementUnitMetadata_field_idx" ON "FinancialStatementUnitMetadata"("field");
