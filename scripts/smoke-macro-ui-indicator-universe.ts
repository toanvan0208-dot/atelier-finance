import fs from 'fs';
import path from 'path';

function runSmoke() {
  console.log("=== Smoke Test: Macro UI Indicator Universe ===");
  const rootDir = process.cwd();
  
  const uiPath = path.join(rootDir, "src/features/macro/components/MacroPage.tsx");
  const sectionPath = path.join(rootDir, "src/features/macro/components/MacroCompassSections.tsx");

  if (!fs.existsSync(uiPath) || !fs.existsSync(sectionPath)) {
    console.error("smokeResult: FAIL - Files not found");
    return;
  }

  const uiContent = fs.readFileSync(uiPath, "utf-8");
  const sectionContent = fs.readFileSync(sectionPath, "utf-8");

  const uiRendersSection = uiContent.includes("<MacroIndicatorUniverseSection");
  const sectionHandlesSupportStatus = sectionContent.includes("indicator.supportStatus ===");
  const sectionShowsLatestObs = sectionContent.includes("indicator.latestObservation.value");

  console.log(`uiRendersSection: ${uiRendersSection}`);
  console.log(`sectionHandlesSupportStatus: ${sectionHandlesSupportStatus}`);
  console.log(`sectionShowsLatestObs: ${sectionShowsLatestObs}`);

  if (uiRendersSection && sectionHandlesSupportStatus && sectionShowsLatestObs) {
    console.log("smokeResult: PASS");
  } else {
    console.log("smokeResult: FAIL");
  }
}

runSmoke();
