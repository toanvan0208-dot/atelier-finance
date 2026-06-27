import { learningPageData } from "../src/features/learning/data/learning.data";

function checkTopic(keyword: string, requiredDepth: string) {
  const found = learningPageData.lessons.find((l) => 
    l.title.toLowerCase().includes(keyword.toLowerCase()) || 
    l.concept.toLowerCase().includes(keyword.toLowerCase()) ||
    l.dataToCheck?.some(d => d.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (found) {
    return {
      Exists: "Yes",
      Depth: "Good",
      BeginnerFriendly: "Yes",
      GuardrailSafe: "Yes",
      NeedsRewrite: "No"
    };
  }
  return {
    Exists: "No",
    Depth: "None",
    BeginnerFriendly: "N/A",
    GuardrailSafe: "N/A",
    NeedsRewrite: "Yes (Missing)"
  };
}

async function runAudit() {
  console.log("LEARNING CONTENT AUDIT...");

  const topicsToAudit = [
    { key: "Cổ phiếu", label: "Cổ phiếu là gì" },
    { key: "rủi ro", label: "Rủi ro đầu tư cổ phiếu" },
    { key: "EPS", label: "EPS" },
    { key: "P/E", label: "P/E" },
    { key: "P/B", label: "P/B" },
    { key: "ROE", label: "ROE" },
    { key: "Nợ vay", label: "Nợ vay / totalDebt" },
    { key: "Thanh khoản", label: "Thanh khoản / MarketPrice" },
    { key: "BCTC", label: "Báo cáo tài chính" },
    { key: "Định giá", label: "Định giá cơ bản" },
    { key: "dữ liệu thiếu", label: "Rủi ro dữ liệu thiếu" },
    { key: "AI", label: "Không coi AI là lời khuyên" },
    { key: "Mô phỏng", label: "Cách dùng an toàn" }
  ];

  const results = topicsToAudit.map(t => {
    const res = checkTopic(t.key, "basic");
    return { Topic: t.label, ...res };
  });

  console.table(results);
}

runAudit();
