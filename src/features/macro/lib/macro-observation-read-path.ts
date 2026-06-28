import { PrismaClient } from "../../../generated/prisma/client";
import { prisma as getPrisma } from "@/lib/database/client";

export interface MacroObservationReadOptions {
    indicatorCodes?: string[];
    region?: string;
    sourceLabel?: string;
    limit?: number;
}

export interface MacroObservationResult {
    available: boolean;
    observations: Array<{
        indicatorCode: string;
        indicatorName?: string;
        region: string;
        observationDate: string;
        value: string | number;
        unit?: string | null;
        frequency?: string | null;
        sourceLabel: string;
        dataMode: string;
        productionApproved: boolean;
        needsReview: boolean;
        provenance?: {
            available: boolean;
            providerType?: string;
            warningCodes?: string[];
            sourceUrl?: string | null;
            retrievedAt?: string | null;
            payloadChecksum?: string | null;
        };
    }>;
    missingIndicators: string[];
    safetyNotes: string[];
}

export async function loadLatestMacroObservations(
    options: MacroObservationReadOptions = {},
    prismaClient?: PrismaClient
): Promise<MacroObservationResult> {
    const prisma = prismaClient || getPrisma;
    
    const result: MacroObservationResult = {
        available: false,
        observations: [],
        missingIndicators: [],
        safetyNotes: [
            "Macro observations are not verified for investment advice.",
            "Assistant MUST NOT generate deterministic macro-to-industry conclusions."
        ]
    };

    try {
        const whereClause: any = {};
        
        if (options.indicatorCodes && options.indicatorCodes.length > 0) {
            whereClause.indicatorCode = { in: options.indicatorCodes };
        }
        if (options.region) {
            whereClause.region = options.region;
        }
        if (options.sourceLabel) {
            whereClause.sourceLabel = options.sourceLabel;
        }

        const observations = await prisma.macroObservation.findMany({
            where: whereClause,
            orderBy: {
                observationDate: 'desc'
            },
            take: options.limit || 50,
            include: {
                indicator: true
            }
        });

        if (!observations || observations.length === 0) {
            if (options.indicatorCodes) {
                result.missingIndicators = [...options.indicatorCodes];
            }
            return result;
        }

        const provenanceRecords = await prisma.macroObservationProvenance.findMany({
            where: {
                OR: observations.map((obs: any) => ({
                    indicatorCode: obs.indicatorCode,
                    region: obs.region,
                    observationDate: obs.observationDate,
                    sourceLabel: obs.sourceLabel
                }))
            }
        });

        result.observations = observations.map((obs: any) => {
            const provenance = provenanceRecords.find((p: any) => 
                p.indicatorCode === obs.indicatorCode &&
                p.region === obs.region &&
                p.observationDate.getTime() === obs.observationDate.getTime() &&
                p.sourceLabel === obs.sourceLabel
            );

            return {
                indicatorCode: obs.indicatorCode,
                indicatorName: obs.indicator.indicatorName,
                region: obs.region,
                observationDate: obs.observationDate.toISOString(),
                value: obs.value ? Number(obs.value) : 0,
                unit: obs.unit,
                frequency: obs.frequency,
                sourceLabel: obs.sourceLabel,
                dataMode: obs.dataMode,
                productionApproved: obs.productionApproved,
                needsReview: obs.needsReview,
                provenance: provenance ? {
                    available: true,
                    providerType: provenance.providerType,
                    warningCodes: provenance.warningCodes ? JSON.parse(provenance.warningCodes) : [],
                    sourceUrl: provenance.sourceUrl,
                    retrievedAt: provenance.retrievedAt?.toISOString() || null,
                    payloadChecksum: provenance.payloadChecksum
                } : { available: false }
            };
        });

        result.available = true;
        
        if (options.indicatorCodes) {
            const foundCodes = new Set(result.observations.map(o => o.indicatorCode));
            result.missingIndicators = options.indicatorCodes.filter(c => !foundCodes.has(c));
        }

        return result;
    } catch (e) {
        // Safe fail-open for empty schema or DB connection issues
        return result;
    }
}
