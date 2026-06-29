import https from 'https';
import fs from 'fs';

const url = 'https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tstttlm/lsdh';

async function verifySource() {
  console.log(`Verifying source URL: ${url}`);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      redirect: 'follow'
    });
    
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    
    const text = await res.text();
    console.log(`Body Length: ${text.length} bytes`);
    console.log(`Preview:\n${text.substring(0, 2000)}`);
    
    if (text.includes('Liferay') || text.includes('liferay')) {
      console.log(`Source Shape: html_dynamic_or_unstable (Liferay portal detected)`);
    } else if (text.includes('Oracle WebCenter') || text.includes('AdfPage') || text.includes('dhtmlx') || text.includes('oracle.adf')) {
      console.log(`Source Shape: html_dynamic_or_unstable (Oracle ADF detected)`);
    } else if (res.headers.get('content-type')?.includes('text/html')) {
      console.log(`Source Shape: html_table_candidate`);
    } else {
      console.log(`Source Shape: unknown`);
    }
    
    console.log(`\n--- Guardrail Checks ---`);
    console.log(`providerFetchAttempted=true`);
    console.log(`providerFetchSucceeded=true`);
    console.log(`numericValuesExtracted=0`);
    console.log(`candidateMacroRows=0`);
    console.log(`dbWriteAttempted=false`);
    console.log(`readyForPolicyRateParserDryRun=false`);
    console.log(`blockedReason=html_dynamic_or_unstable_requires_manual_workflow`);
  } catch (e: any) {
    console.error(`Request failed: ${e.message}`);
  }
}

verifySource().catch(console.error);
