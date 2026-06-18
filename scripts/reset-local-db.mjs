import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const dbFiles = ["dev.db", "dev.db-journal", "prisma/dev.db", "prisma/dev.db-journal"];

for (const file of dbFiles) {
  if (existsSync(file)) {
    rmSync(file, { force: true });
  }
}

const commands = process.platform === "win32"
  ? [
      ["cmd.exe", ["/d", "/s", "/c", "npm run db:migrate"]],
      ["cmd.exe", ["/d", "/s", "/c", "npm run db:seed"]],
    ]
  : [
      ["npm", ["run", "db:migrate"]],
      ["npm", ["run", "db:seed"]],
    ];

for (const command of commands) {
  const result = spawnSync(command[0], command[1], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
