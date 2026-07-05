import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/client";

export type UserWatchlistItem = {
  company?: {
    companyName?: string | null;
    exchange?: string | null;
    industryName?: string | null;
  } | null;
  createdAt?: string;
  notes?: string | null;
  priority?: string | null;
  status?: string | null;
  thesisSummary?: string | null;
  ticker: string;
};

export async function loadUserWatchlistItems(): Promise<UserWatchlistItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const items = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      company: {
        select: {
          companyName: true,
          exchange: true,
          industryName: true,
        },
      },
    },
  });

  return items.map((item) => ({
    company: item.company,
    createdAt: item.createdAt.toISOString(),
    notes: item.notes,
    priority: item.priority,
    status: item.status,
    thesisSummary: item.thesisSummary,
    ticker: item.ticker,
  }));
}
