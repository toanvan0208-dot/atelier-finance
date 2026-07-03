export const parseJsonObject = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body = (await request.json()) as unknown;
    return typeof body === "object" && body !== null && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
};

export const stringField = (body: Record<string, unknown>, field: string): string | null => {
  const value = body[field];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
