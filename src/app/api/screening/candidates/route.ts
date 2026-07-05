import { loadScreeningCandidatePayload } from "@/features/screening/lib/screening-candidate-read-path";
import { apiDataReadError, apiSuccess } from "@/lib/api/response";

export const GET = async (): Promise<Response> => {
  try {
    const candidates = await loadScreeningCandidatePayload();

    return apiSuccess(candidates, {
      meta: {
        count: candidates.length,
        source: "screening_candidate_dedicated_tables",
        fallback: false,
        tvnExcluded: true,
        rankingCreated: false,
        stockAttractivenessScoreCreated: false,
        benchmarkCreated: false,
        industryMetricCreated: false,
        productionApprovedTrueCount: candidates.filter((candidate) => candidate.productionApproved).length,
      },
    });
  } catch (error) {
    return apiDataReadError(error);
  }
};
