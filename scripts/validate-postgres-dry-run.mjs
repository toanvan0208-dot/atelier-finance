import { spawnSync } from "node:child_process";

const POSTGRES_DRY_RUN_URL = "postgresql://atelier:atelier@localhost:5432/atelier_finance?schema=public";

console.log("=================================================");
console.log("Starting PostgreSQL Dry-Run Environment Isolation");
console.log("=================================================");

// Override DATABASE_URL explicitly to prevent .env.local leak
process.env.DATABASE_URL = POSTGRES_DRY_RUN_URL;

console.log(`Forced DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log("This prevents Next.js or Prisma from falling back to file:./dev.db in .env.local\n");

const isWin = process.platform === "win32";
const spawnOpts = { stdio: "inherit", env: process.env };

const runCommand = (cmd, args) => {
  console.log(`\n> Running: ${cmd} ${args.join(" ")}`);
  
  // Use shell to resolve npx/npm properly on Windows
  const result = spawnSync(cmd, args, { ...spawnOpts, shell: isWin });

  if (result.error) {
    console.error(`Error spawning command: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n❌ Command failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
};

// Sequences of validation commands
runCommand("npx", ["prisma", "validate"]);
runCommand("npx", ["prisma", "generate"]);
runCommand("npm", ["run", "typecheck"]);
runCommand("npm", ["run", "lint"]);
runCommand("npm", ["test"]);
runCommand("npm", ["run", "build"]);

console.log("\n✅ All validations passed in PostgreSQL dry-run environment!");
