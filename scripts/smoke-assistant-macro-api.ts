async function run() {
  console.log("=== Assistant Macro HTTP API Smoke Test ===");
  try {
    const response = await fetch("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: "Bối cảnh vĩ mô GDP và CPI hiện tại ra sao?",
        activeModule: "macro"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.log("HTTP Error:", response.status, data);
      process.exit(1);
    }

    console.log("DATA RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    const contextUsed = data.runtime?.promptText || JSON.stringify(data);
    console.log("Response OK. Checking if context was injected...");
    const hasCpi = contextUsed.includes("CPI_YOY");
    const hasGdp = contextUsed.includes("GDP_GROWTH");
    const hasMacroContext = contextUsed.includes("macroContext");

    console.log("Has macroContext:", hasMacroContext);
    console.log("Has CPI_YOY:", hasCpi);
    console.log("Has GDP_GROWTH:", hasGdp);

    if (hasMacroContext && hasCpi && hasGdp) {
      console.log("SUCCESS: Macro context successfully retrieved via HTTP API.");
      process.exit(0);
    } else {
      console.log("FAILED: Macro context missing from HTTP response contextUsed.");
      process.exit(1);
    }

  } catch (error) {
    console.error("Error during HTTP request:", error);
    process.exit(1);
  }
}

run();
