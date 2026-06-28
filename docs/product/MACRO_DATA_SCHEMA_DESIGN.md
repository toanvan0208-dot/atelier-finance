# Macro Data Schema Design Proposal

**Status**: proposed  
**Migration State**: not migrated  
**Review Status**: requires review

## Context
Atelier Finance requires real, verifiable macroeconomic data to support beginner-friendly analysis. The current `MacroContext` schema is text-based and primarily intended for serving pre-compiled context to the Assistant. We need a robust structured timeseries model to store quantitative macroeconomic indicators (e.g., CPI, GDP, Interest Rates) with verifiable provenance.

## Proposed Schema

### 1. MacroIndicator
A master registry of supported macroeconomic indicators.

```prisma
model MacroIndicator {
  code               String   @id // e.g., 'CPI_YOY', 'GDP_GROWTH', 'POLICY_RATE'
  name               String   // "Tăng trưởng GDP", "Chỉ số giá tiêu dùng"
  description        String?  // Beginner-friendly explanation
  defaultUnit        String   // e.g., "% YoY", "%"
  defaultFrequency   String   // e.g., "annual", "monthly"
  
  observations       MacroObservation[]
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

### 2. MacroObservation
The actual timeseries data point for a given indicator.

```prisma
model MacroObservation {
  id                 String   @id @default(cuid())
  indicatorCode      String
  region             String   @default("VN")
  observationDate    DateTime // The period the data represents (e.g., 2024-12-31 for 2024 GDP)
  publishedAt        DateTime? // When the data was officially published
  
  value              Float
  unit               String
  frequency          String
  
  // Provenance / Review Status
  dataMode           String   @default("candidate_macro_data") // "candidate_macro_data", "research_only", "production_approved"
  productionApproved Boolean  @default(false)
  needsReview        Boolean  @default(true)
  warningCodes       String[] // e.g., ["UNVERIFIED_SOURCE", "PRELIMINARY_DATA"]
  
  // Relations
  indicator          MacroIndicator @relation(fields: [indicatorCode], references: [code])
  provenance         MacroObservationProvenance?
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@unique([indicatorCode, region, observationDate])
}
```

### 3. MacroObservationProvenance
Metadata regarding the source and fetch details for a specific observation.

```prisma
model MacroObservationProvenance {
  id                 String   @id @default(cuid())
  observationId      String   @unique
  
  sourceLabel        String   // e.g., "World Bank API", "SBV Open Data"
  providerType       String   // e.g., "official_api", "undocumented_provider"
  sourceUrl          String?  // The specific API endpoint or report URL used
  
  fetchedAt          DateTime @default(now())
  
  observation        MacroObservation @relation(fields: [observationId], references: [id])
}
```

## Field Definitions & Guardrails

- `dataMode`: Dictates the usage context. Must be `candidate_macro_data` or `research_only` until fully verified.
- `productionApproved`: Must explicitly be flipped to `true` by a human administrator. Default is `false`.
- `needsReview`: Automatically flagged `true` upon ingestion.
- `warningCodes`: Allows programmatic insertion of warnings like `UNVERIFIED_SOURCE` if fetched from a non-SLA candidate provider.
- `sourceLabel` & `providerType`: Crucial for the Assistant to correctly cite the data origin to the user.

## Migration Strategy
We will not execute a Prisma migration in Phase 147A. This design is strictly a proposal to guide the ingestion preview. The migration will be scheduled in a subsequent phase (e.g., 147B) once a confirmed data source is established and fully audited.
