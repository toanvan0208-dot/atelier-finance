import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DataMode, PaperTradeAction, PaperTradeStatus, ReadinessStatus } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const DEMO_EMAIL = "demo@atelier.local";
const DEMO_PASSWORD = "AtelierDemo123!";

const loadEnv = () => {
  for (const fileName of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), fileName);
    if (!existsSync(envPath)) continue;

    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator);
      const rawValue = trimmed.slice(separator + 1);
      process.env[key] ||= rawValue.replace(/^"|"$/g, "");
    }
  }
};

type DemoCompany = {
  id: string;
  ticker: string;
};

const companyFor = (companies: Map<string, DemoCompany>, ticker: string): DemoCompany => {
  const company = companies.get(ticker);
  if (!company) throw new Error(`Missing company for demo ticker ${ticker}. Seed/import company data first.`);
  return company;
};

async function main() {
  loadEnv();
  const { prisma } = await import("../src/lib/database/client");

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      displayName: "Atelier Demo User",
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
    update: {
      displayName: "Atelier Demo User",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });

  const companyRows = await prisma.company.findMany({
    where: { ticker: { in: ["HPG", "MWG", "VNM"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, ticker: true },
  });
  const companies = new Map(companyRows.map((company) => [company.ticker, company]));

  await prisma.$transaction([
    prisma.userChecklist.deleteMany({ where: { userId: user.id } }),
    prisma.simulationJournal.deleteMany({ where: { userId: user.id } }),
    prisma.simulationScenario.deleteMany({ where: { userId: user.id } }),
    prisma.paperTrade.deleteMany({ where: { userId: user.id } }),
    prisma.simulationProfile.deleteMany({ where: { userId: user.id } }),
    prisma.watchlist.deleteMany({ where: { userId: user.id } }),
  ]);

  const hpg = companyFor(companies, "HPG");
  const mwg = companyFor(companies, "MWG");
  const vnm = companyFor(companies, "VNM");

  await prisma.watchlist.createMany({
    data: [
      {
        companyId: hpg.id,
        dataMode: DataMode.user_input,
        notes: "Theo dõi biên gộp, tồn kho và áp lực giá nguyên liệu trước khi đưa vào mô phỏng.",
        priority: "Ưu tiên cao",
        readiness: ReadinessStatus.needs_review,
        status: "Đang phân tích",
        thesisSummary: "HPG cần được kiểm tra qua giá vốn, tồn kho, dòng tiền và chu kỳ thép; chưa tạo kết luận đầu tư.",
        ticker: "HPG",
        userId: user.id,
      },
      {
        companyId: mwg.id,
        dataMode: DataMode.user_input,
        notes: "Theo dõi tồn kho, chi phí bán hàng, dòng tiền hoạt động và hiệu quả vận hành chuỗi.",
        priority: "Ưu tiên vừa",
        readiness: ReadinessStatus.needs_review,
        status: "Sẵn sàng mô phỏng",
        thesisSummary: "MWG có đủ dữ liệu nền để mô phỏng kỷ luật theo dõi thesis, vẫn cần kiểm tra rủi ro biên và sức mua.",
        ticker: "MWG",
        userId: user.id,
      },
      {
        companyId: vnm.id,
        dataMode: DataMode.user_input,
        notes: "Theo dõi biên lợi nhuận, sức mua, nguyên liệu đầu vào và khả năng giữ thị phần.",
        priority: "Theo dõi nhẹ",
        readiness: ReadinessStatus.needs_review,
        status: "Cần xem lại",
        thesisSummary: "VNM cần bổ sung kiểm chứng về tăng trưởng doanh thu, biên lợi nhuận và nguyên liệu trước khi mô phỏng.",
        ticker: "VNM",
        userId: user.id,
      },
    ],
  });

  await prisma.simulationProfile.create({
    data: {
      cash: 72_500_000,
      dataMode: DataMode.user_input,
      notes: "Demo profile: dùng để minh họa luồng mô phỏng và nhật ký, không phải khuyến nghị giao dịch.",
      readiness: ReadinessStatus.needs_review,
      riskBudgetPercent: 12,
      totalCapital: 100_000_000,
      userId: user.id,
    },
  });

  const mwgTrade = await prisma.paperTrade.create({
    data: {
      action: PaperTradeAction.open_position,
      companyId: mwg.id,
      entryPrice: 62_000,
      openedAt: new Date("2026-07-01T09:00:00+07:00"),
      quantity: 300,
      readiness: ReadinessStatus.needs_review,
      reflection: "Quan sát xem tồn kho và chi phí bán hàng có cải thiện đúng thesis không.",
      sourceMode: DataMode.user_input,
      status: PaperTradeStatus.open,
      thesisSnapshot: "Mô phỏng MWG để luyện theo dõi thesis phục hồi vận hành; không phải tín hiệu mua.",
      ticker: "MWG",
      userId: user.id,
    },
  });

  const hpgTrade = await prisma.paperTrade.create({
    data: {
      action: PaperTradeAction.observe_position,
      companyId: hpg.id,
      entryPrice: 29_500,
      openedAt: new Date("2026-07-02T09:00:00+07:00"),
      quantity: 500,
      readiness: ReadinessStatus.needs_review,
      reflection: "Chỉ quan sát giả lập vì cần kiểm tra thêm giá vốn và tồn kho.",
      sourceMode: DataMode.user_input,
      status: PaperTradeStatus.open,
      thesisSnapshot: "HPG được đưa vào kế hoạch mô phỏng sau khi hoàn tất checklist ngành thép.",
      ticker: "HPG",
      userId: user.id,
    },
  });

  await prisma.simulationScenario.createMany({
    data: [
      {
        companyId: mwg.id,
        condition: "Báo cáo quý tiếp theo cho thấy tồn kho tăng nhanh hơn doanh thu.",
        dataMode: DataMode.user_input,
        impactOnPosition: "Thesis phục hồi vận hành yếu đi; cần giảm giả định tích cực trong mô phỏng.",
        paperTradeId: mwgTrade.id,
        readiness: ReadinessStatus.needs_review,
        relatedModules: JSON.stringify(["financials", "risk", "checklist"]),
        scenarioType: "negative",
        signalsToWatch: JSON.stringify(["inventory", "grossProfit", "operatingCashFlow", "sellingExpense"]),
        suggestedSimulationResponse: "Ghi nhật ký phản biện, không tăng vị thế mô phỏng cho đến khi kiểm tra lại BCTC.",
        ticker: "MWG",
        title: "Tồn kho MWG tăng nhanh hơn doanh thu",
        userId: user.id,
      },
      {
        companyId: hpg.id,
        condition: "Giá nguyên liệu đầu vào biến động mạnh trong khi biên gộp chưa xác nhận cải thiện.",
        dataMode: DataMode.user_input,
        impactOnPosition: "Chỉ giữ trạng thái planned/observe, chưa chuyển sang vị thế mô phỏng mở.",
        paperTradeId: hpgTrade.id,
        readiness: ReadinessStatus.needs_review,
        relatedModules: JSON.stringify(["industry", "financials", "technical"]),
        scenarioType: "market_risk",
        signalsToWatch: JSON.stringify(["costOfGoodsSold", "grossProfit", "inventory", "operatingCashFlow"]),
        suggestedSimulationResponse: "Quay lại checklist HPG và cập nhật risk breaker trước khi hành động mô phỏng.",
        ticker: "HPG",
        title: "Áp lực nguyên liệu ngành thép",
        userId: user.id,
      },
    ],
  });

  await prisma.simulationJournal.createMany({
    data: [
      {
        companyId: mwg.id,
        content: "Mở vị thế mô phỏng nhỏ để luyện theo dõi thesis phục hồi vận hành. Điều kiện sai: tồn kho và chi phí bán hàng xấu đi.",
        dataMode: DataMode.user_input,
        eventType: "position_opened",
        metadata: JSON.stringify({ source: "demo_seed", noInvestmentAdvice: true }),
        paperTradeId: mwgTrade.id,
        readiness: ReadinessStatus.needs_review,
        ticker: "MWG",
        title: "Mở mô phỏng MWG",
        userId: user.id,
      },
      {
        companyId: hpg.id,
        content: "Chưa mở vị thế HPG; cần hoàn tất checklist động và đối chiếu tồn kho, giá vốn, dòng tiền.",
        dataMode: DataMode.user_input,
        eventType: "scenario_reviewed",
        metadata: JSON.stringify({ source: "demo_seed", noInvestmentAdvice: true }),
        paperTradeId: hpgTrade.id,
        readiness: ReadinessStatus.needs_review,
        ticker: "HPG",
        title: "Rà soát kịch bản HPG",
        userId: user.id,
      },
      {
        companyId: vnm.id,
        content: "VNM vẫn ở watchlist, cần thêm kiểm chứng biên lợi nhuận và nguyên liệu trước khi đưa vào mô phỏng.",
        dataMode: DataMode.user_input,
        eventType: "note_added",
        metadata: JSON.stringify({ source: "demo_seed", noInvestmentAdvice: true }),
        readiness: ReadinessStatus.needs_review,
        ticker: "VNM",
        title: "Ghi chú theo dõi VNM",
        userId: user.id,
      },
    ],
  });

  const checklistScenarios = await prisma.thinkingQuestionScenario.findMany({
    where: {
      productionApproved: false,
      scenarioId: { in: ["THINK_HPG_01", "THINK_HPG_02", "THINK_HPG_03"] },
      ticker: "HPG",
    },
    orderBy: { scenarioId: "asc" },
  });

  if (checklistScenarios.length > 0) {
    await prisma.userChecklist.create({
      data: {
        companyId: hpg.id,
        contextSnapshot: JSON.stringify({
          answeredCount: checklistScenarios.length,
          source: "demo_seed_thinking_question_scenario_db",
          ticker: "HPG",
          totalScenarioCount: 9,
        }),
        readiness: ReadinessStatus.needs_review,
        results: {
          create: checklistScenarios.map((scenario) => ({
            answer: scenario.correctAnswer,
            evidenceSnapshot: JSON.stringify({
              correctAnswer: scenario.correctAnswer,
              dataQualityStatus: scenario.dataQualityStatus,
              evidenceFields: JSON.parse(scenario.evidenceFields) as string[],
              evidenceStatus: scenario.evidenceStatus,
              guardrailNote: scenario.guardrailNote,
            }),
            missingFields: "[]",
            status: "answered_correct",
            thinkingQuestionScenarioId: scenario.id,
            warningCodes: JSON.stringify(["DEMO_SEED", "DYNAMIC_THINKING_CANDIDATE", "PRODUCTION_APPROVED_FALSE"]),
          })),
        },
        status: "draft",
        summary: `Demo checklist HPG: đã trả lời ${checklistScenarios.length}/9 câu hỏi động bằng dữ liệu candidate.`,
        ticker: "HPG",
        userId: user.id,
      },
    });
  }

  console.log(JSON.stringify({
    demoEmail: DEMO_EMAIL,
    demoPassword: DEMO_PASSWORD,
    dynamicChecklistResults: checklistScenarios.length,
    paperTrades: 2,
    simulationJournals: 3,
    simulationScenarios: 2,
    simulationProfile: 1,
    userId: user.id,
    watchlistItems: 3,
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
