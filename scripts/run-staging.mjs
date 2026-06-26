import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env.staging.local');

const envContent = readFileSync(envPath, 'utf-8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env.staging.local");
  process.exit(1);
}

const dbUrl = match[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
const safe = {
  exists: !!dbUrl,
  isPostgres: /^postgres(ql)?:\/\//.test(dbUrl),
  isLocalhost: /localhost|127\.0\.0\.1/.test(dbUrl),
  isFileUrl: /file:|dev\.db/.test(dbUrl),
  hostIsSupabase: (() => {
    try {
      const u = new URL(dbUrl);
      return u.hostname.includes('supabase');
    } catch {
      return false;
    }
  })()
};

if (process.argv[2] === '--verify') {
  console.log(JSON.stringify(safe, null, 2));
  if (!safe.exists || !safe.isPostgres || safe.isLocalhost || safe.isFileUrl || !safe.hostIsSupabase) {
    console.error("Safety check failed");
    process.exit(1);
  }
  process.exit(0);
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

process.env.DATABASE_URL = dbUrl;
const isWin = process.platform === "win32";

// Special handling if the user wants to pass DATABASE_URL to a docker command inline
const processedArgs = args.map(arg => arg === "$DATABASE_URL" || arg === "%DATABASE_URL%" ? dbUrl : arg);

const result = spawnSync(cmd, processedArgs, { stdio: 'inherit', env: process.env, shell: isWin });
if (result.error) {
  console.error(`Error spawning command: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
