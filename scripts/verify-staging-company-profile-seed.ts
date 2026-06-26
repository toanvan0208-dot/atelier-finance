import { prisma } from "../src/lib/database/client.js";

async function verify() {
  const profiles = await prisma.companyBusinessProfile.findMany({
    where: {
      sourceLabel: "staging_company_business_profile_research_seed"
    }
  });

  let hasError = false;

  console.log(`Found ${profiles.length} profiles with sourceLabel = 'staging_company_business_profile_research_seed'.`);

  if (profiles.length !== 5) {
    console.error("Expected exactly 5 profiles.");
    hasError = true;
  }

  const approvedTickers = ["FPT", "HPG", "VNM", "MSN", "MWG"];
  let vcbFound = false;

  for (const p of profiles) {
    if (!approvedTickers.includes(p.ticker)) {
      console.error(`ERROR: Found unauthorized ticker ${p.ticker}`);
      hasError = true;
    }
    if (p.ticker === "VCB") {
      vcbFound = true;
      hasError = true;
    }
    if (p.dataMode !== "research_only") {
      console.error(`ERROR: Incorrect dataMode for ${p.ticker}: ${p.dataMode}`);
      hasError = true;
    }
    if (p.productionApproved !== false) {
      console.error(`ERROR: productionApproved is true for ${p.ticker}`);
      hasError = true;
    }
    if (p.needsReview !== true) {
      console.error(`ERROR: needsReview is false for ${p.ticker}`);
      hasError = true;
    }
    if (!p.businessDescription) {
      console.error(`ERROR: Missing businessDescription for ${p.ticker}`);
      hasError = true;
    }
    if (p.businessDescription && (p.businessDescription.includes("official") || p.businessDescription.includes("khuyến nghị"))) {
      console.error(`ERROR: Guardrail violation in description for ${p.ticker}`);
      hasError = true;
    }
  }

  if (vcbFound) {
    console.error("ERROR: VCB was imported.");
  } else {
    console.log("VCB correctly excluded.");
  }

  if (hasError) {
    console.error("Read-back verification FAILED.");
    process.exit(1);
  } else {
    console.log("Read-back verification PASSED. All data constraints matched.");
  }
}

verify()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
