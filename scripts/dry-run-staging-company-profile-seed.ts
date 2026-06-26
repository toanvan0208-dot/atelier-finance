import { prisma } from "../src/lib/database/client";

const APPROVED_TICKERS = ["FPT", "HPG", "VNM", "MSN", "MWG"];
const SOURCE_LABEL = "staging_company_business_profile_research_seed";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DATA_MODE = "research_only" as any;

interface ProfileSeed {
  ticker: string;
  businessDescription: string;
  mainProducts: string;
  businessRiskNotes: string;
}

const seedData: ProfileSeed[] = [
  {
    ticker: "FPT",
    businessDescription: "Hoạt động trong lĩnh vực công nghệ thông tin, viễn thông và giáo dục.",
    mainProducts: "Phần mềm, viễn thông, giáo dục",
    businessRiskNotes: "Rủi ro công nghệ, rủi ro cạnh tranh nhân lực"
  },
  {
    ticker: "HPG",
    businessDescription: "Sản xuất và kinh doanh các sản phẩm thép, thép ống, tôn mạ, nông nghiệp và bất động sản.",
    mainProducts: "Thép xây dựng, thép cuộn cán nóng, ống thép, thịt heo",
    businessRiskNotes: "Rủi ro giá nguyên vật liệu, chu kỳ ngành thép"
  },
  {
    ticker: "VNM",
    businessDescription: "Sản xuất và kinh doanh sữa và các sản phẩm từ sữa.",
    mainProducts: "Sữa nước, sữa chua, sữa bột, sữa đặc",
    businessRiskNotes: "Rủi ro giá sữa nguyên liệu, rủi ro cạnh tranh"
  },
  {
    ticker: "MSN",
    businessDescription: "Sản xuất hàng tiêu dùng thiết yếu, bán lẻ, vật liệu công nghệ cao và thịt.",
    mainProducts: "Nước mắm, gia vị, chuỗi siêu thị, thịt có thương hiệu",
    businessRiskNotes: "Rủi ro chuỗi cung ứng, rủi ro sức mua tiêu dùng"
  },
  {
    ticker: "MWG",
    businessDescription: "Bán lẻ thiết bị điện tử, điện thoại di động, hàng gia dụng và bách hóa.",
    mainProducts: "Điện thoại, điện máy, bách hóa",
    businessRiskNotes: "Rủi ro sức mua tiêu dùng, cạnh tranh bán lẻ"
  }
];

async function main() {
  const isConfirmWrite = process.argv.includes("--confirm-write");

  // Validate environment
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("supabase")) {
    console.error("ERROR: DATABASE_URL must point to Supabase staging.");
    process.exit(1);
  }
  if (dbUrl.includes("dev.db") || dbUrl.startsWith("file:")) {
    console.error("ERROR: DATABASE_URL cannot be SQLite/local.");
    process.exit(1);
  }

  console.log("=== Staging Company Business Profile Seed ===");
  console.log(`writeEnabled: ${isConfirmWrite}`);
  console.log(`confirmWrite: ${isConfirmWrite}`);
  console.log(`DB write: ${isConfirmWrite ? "Yes" : "No"}`);
  console.log(`approved tickers: ${APPROVED_TICKERS.join(", ")}`);
  console.log(`VCB excluded: true`);
  console.log(`sourceLabel: ${SOURCE_LABEL}`);
  console.log(`dataMode: ${DATA_MODE}`);
  console.log(`productionApproved: false`);
  console.log(`connection string: masked only`);
  console.log("rollback criteria: Delete precisely the CompanyBusinessProfile rows with captured IDs\n");

  const results: { ticker: string; id: string }[] = [];
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const data of seedData) {
    if (!APPROVED_TICKERS.includes(data.ticker)) {
      console.log(`Skipping unauthorized ticker: ${data.ticker}`);
      skippedCount++;
      continue;
    }
    if (data.ticker === "VCB") {
      console.log("Skipping VCB.");
      skippedCount++;
      continue;
    }

    const company = await prisma.company.findFirst({
      where: { ticker: data.ticker }
    });

    if (!company) {
      console.log(`Company not found for ${data.ticker}, skipping.`);
      skippedCount++;
      continue;
    }

    const profileInput = {
      ticker: data.ticker,
      companyId: company.id,
      businessDescription: data.businessDescription,
      mainProducts: data.mainProducts,
      businessRiskNotes: data.businessRiskNotes,
      sourceLabel: SOURCE_LABEL,
      dataMode: DATA_MODE,
      profileLanguage: "vi",
      productionApproved: false,
      needsReview: true
    };

    if (isConfirmWrite) {
      const existing = await prisma.companyBusinessProfile.findUnique({
        where: {
          ticker_sourceLabel_profileLanguage: {
            ticker: data.ticker,
            sourceLabel: SOURCE_LABEL,
            profileLanguage: "vi"
          }
        }
      });

      let saved;
      if (existing) {
        saved = await prisma.companyBusinessProfile.update({
          where: { id: existing.id },
          data: profileInput
        });
        updatedCount++;
        console.log(`Updated profile for ${data.ticker} (ID: ${saved.id})`);
      } else {
        saved = await prisma.companyBusinessProfile.create({
          data: profileInput
        });
        insertedCount++;
        console.log(`Inserted profile for ${data.ticker} (ID: ${saved.id})`);
      }
      results.push(saved);
    } else {
      console.log(`[DRY RUN] Would upsert profile for ${data.ticker}`);
      insertedCount++; // Simulating insert for dry-run counts
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Rows inserted: ${isConfirmWrite ? insertedCount : 0} (Dry-run simulated: ${insertedCount})`);
  console.log(`Rows updated: ${updatedCount}`);
  console.log(`Rows skipped: ${skippedCount}`);
  
  if (isConfirmWrite && results.length > 0) {
    console.log("\nCaptured IDs for rollback:");
    results.forEach(r => {
      console.log(`- ${r.ticker}: ${r.id}`);
    });
  }
}

main()
  .catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
