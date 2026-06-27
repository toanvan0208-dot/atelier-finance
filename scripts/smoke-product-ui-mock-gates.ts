import * as fs from "fs";
import * as path from "path";

async function runSmokeTests() {
  const rootDir = path.resolve(__dirname, "..");
  
  const navContent = fs.readFileSync(path.join(rootDir, "src/config/navigation.config.ts"), "utf-8");
  if (navContent.includes('key: "simulation"') && !navContent.includes('//   key: "simulation"')) {
    throw new Error("Simulation link is still active in navigation.config.ts");
  }
  if (navContent.includes('key: "watchlist"') && !navContent.includes('//   key: "watchlist"')) {
    throw new Error("Watchlist link is still active in navigation.config.ts");
  }

  const appShellContent = fs.readFileSync(path.join(rootDir, "src/components/layout/AppShell.tsx"), "utf-8");
  if (!appShellContent.includes("PRODUCT_MODULE_GATES")) {
    throw new Error("AppShell.tsx does not use PRODUCT_MODULE_GATES");
  }

  const businessUIContent = fs.readFileSync(path.join(rootDir, "src/features/business/components/BusinessUnderstandingDashboard.tsx"), "utf-8");
  if (businessUIContent.includes("Mock data, cần thay bằng API thật") || businessUIContent.includes("isMock")) {
    throw new Error("BusinessUnderstandingDashboard.tsx still contains mock data chips/labels");
  }

  const learningUIContent = fs.readFileSync(path.join(rootDir, "src/features/learning/components/LearningPage.tsx"), "utf-8");
  if (!learningUIContent.includes("Nội dung học tập / kiến thức nền tảng")) {
    throw new Error("LearningPage.tsx does not contain educational disclaimer");
  }

  const assistantUIContent = fs.readFileSync(path.join(rootDir, "src/components/layout/RightAssistantPanel.tsx"), "utf-8");
  if (!assistantUIContent.includes("AI chỉ hỗ trợ giải thích dữ liệu và khái niệm")) {
    throw new Error("RightAssistantPanel.tsx does not contain AI safety disclaimer");
  }

  console.log("Product UI Mock Gates Smoke Test: PASS");
  console.log("- Simulation is hidden from navigation");
  console.log("- Watchlist is hidden from navigation");
  console.log("- AppShell renders gated states via PRODUCT_MODULE_GATES");
  console.log("- Business UI mock chips are removed");
  console.log("- Learning UI includes educational disclaimer");
  console.log("- Assistant UI includes AI safety disclaimer");
}

runSmokeTests().catch((err) => {
  console.error("Product UI Mock Gates Smoke Test: FAIL");
  console.error(err.message);
  process.exit(1);
});
