import { spawn } from 'child_process';
import fs from 'fs';

let envDbUrl = process.env.DATABASE_URL || "";
if (envDbUrl.includes("sslmode=require")) {
  envDbUrl = envDbUrl.replace("sslmode=require", "sslmode=no-verify");
} else if (!envDbUrl.includes("sslmode=")) {
  envDbUrl += (envDbUrl.includes("?") ? "&" : "?") + "sslmode=no-verify";
}

const s = spawn('npm', ['run', 'start', '--', '-p', '3456'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: envDbUrl, NODE_TLS_REJECT_UNAUTHORIZED: "0" }
});

setTimeout(async () => {
  try {
    const r = await fetch('http://localhost:3456/workspace?module=technical&ticker=FPT');
    const t = await r.text();
    fs.writeFileSync('scratch.html', t);
  } catch (e: any) {
    console.error(e);
  } finally {
    s.kill();
  }
}, 5000);
