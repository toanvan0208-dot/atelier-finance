-- CreateTable
CREATE TABLE "CompanyBusinessProfile" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyId" TEXT,
    "businessDescription" TEXT,
    "businessModelSummary" TEXT,
    "mainProducts" TEXT,
    "revenueDrivers" TEXT,
    "businessRiskNotes" TEXT,
    "profileLanguage" TEXT NOT NULL DEFAULT 'vi',
    "asOfDate" TIMESTAMP(3),
    "sourceLabel" TEXT NOT NULL,
    "dataMode" "DataMode" NOT NULL,
    "productionApproved" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyBusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyBusinessProfile_ticker_idx" ON "CompanyBusinessProfile"("ticker");

-- CreateIndex
CREATE INDEX "CompanyBusinessProfile_sourceLabel_idx" ON "CompanyBusinessProfile"("sourceLabel");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyBusinessProfile_ticker_sourceLabel_profileLanguage_key" ON "CompanyBusinessProfile"("ticker", "sourceLabel", "profileLanguage");

-- AddForeignKey
ALTER TABLE "CompanyBusinessProfile" ADD CONSTRAINT "CompanyBusinessProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
