import { DataMode } from "@/generated/prisma/client";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { listCompanies } from "@/lib/database";

const dataModes = new Set(Object.values(DataMode));

const parseDataMode = (request: Request): DataMode | undefined => {
  const value = new URL(request.url).searchParams.get("dataMode");
  if (!value) return undefined;
  return dataModes.has(value as DataMode) ? (value as DataMode) : undefined;
};

const parseLimit = (request: Request): number | undefined => {
  const value = new URL(request.url).searchParams.get("limit");
  if (!value) return undefined;
  const limit = Number(value);
  return Number.isInteger(limit) && limit > 0 ? limit : undefined;
};

export const GET = async (request: Request): Promise<Response> => {
  try {
    const requestedDataMode = new URL(request.url).searchParams.get("dataMode");
    const dataMode = parseDataMode(request);

    if (requestedDataMode && !dataMode) {
      return apiError("INVALID_DATA_MODE", "Requested data mode is not supported.", {
        status: 400,
      });
    }

    const companies = await listCompanies({
      dataMode,
      limit: parseLimit(request),
    });

    return apiSuccess(companies, {
      meta: {
        count: companies.length,
        source: "database",
        fallback: false,
      },
    });
  } catch {
    return apiInternalError();
  }
};
