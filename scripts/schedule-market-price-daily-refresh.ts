import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const tsxCliPath = require.resolve("tsx/cli");

type SchedulerConfig = {
  confirmWrite: boolean;
  runOnStart: boolean;
  runOnce: boolean;
  timeOfDay: string;
};

const DEFAULT_TIME_OF_DAY = "18:30";

function readBooleanEnv(name: string): boolean {
  return process.env[name]?.toLowerCase() === "true";
}

function readConfig(): SchedulerConfig {
  return {
    confirmWrite: readBooleanEnv("MARKET_PRICE_DAILY_REFRESH_CONFIRM_WRITE"),
    runOnStart: readBooleanEnv("MARKET_PRICE_DAILY_REFRESH_RUN_ON_START"),
    runOnce: readBooleanEnv("MARKET_PRICE_DAILY_REFRESH_RUN_ONCE"),
    timeOfDay: process.env.MARKET_PRICE_DAILY_REFRESH_TIME ?? DEFAULT_TIME_OF_DAY,
  };
}

function parseTimeOfDay(value: string): { hour: number; minute: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid MARKET_PRICE_DAILY_REFRESH_TIME "${value}". Use HH:mm, for example 18:30.`);
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function nextRunDate(timeOfDay: string, now = new Date()): Date {
  const { hour, minute } = parseTimeOfDay(timeOfDay);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function msUntil(date: Date): number {
  return Math.max(date.getTime() - Date.now(), 0);
}

function runRefreshJob(config: SchedulerConfig, reason: string): Promise<number> {
  const args = [tsxCliPath, "scripts/job-market-price-daily-refresh.ts"];
  if (config.confirmWrite) args.push("--confirm-write");

  console.log(`[market-price-daily-refresh] runReason=${reason}`);
  console.log(`[market-price-daily-refresh] confirmWrite=${config.confirmWrite}`);
  console.log(`[market-price-daily-refresh] command=node ${args.join(" ")}`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function scheduleLoop(config: SchedulerConfig): Promise<void> {
  let running = false;

  async function runAndSchedule(reason: string) {
    if (running) {
      console.log("[market-price-daily-refresh] skipped=true reason=previous_run_still_running");
    } else {
      running = true;
      const exitCode = await runRefreshJob(config, reason).catch((error) => {
        console.error("[market-price-daily-refresh] jobError", error);
        return 1;
      });
      console.log(`[market-price-daily-refresh] exitCode=${exitCode}`);
      running = false;
    }

    if (config.runOnce) return;

    const next = nextRunDate(config.timeOfDay);
    console.log(`[market-price-daily-refresh] nextRun=${next.toISOString()} localTime=${config.timeOfDay}`);
    setTimeout(() => {
      void runAndSchedule("scheduled_daily_run");
    }, msUntil(next));
  }

  console.log("phase: market-price-daily-refresh-scheduler");
  console.log("mode: local_daily_scheduler");
  console.log(`scheduledAutoRunEnabled: true`);
  console.log(`cronRegistered: false`);
  console.log(`productionCronEnabled: false`);
  console.log(`timeOfDay: ${config.timeOfDay}`);
  console.log(`confirmWrite: ${config.confirmWrite}`);
  console.log(`runOnStart: ${config.runOnStart}`);
  console.log(`runOnce: ${config.runOnce}`);

  if (config.runOnStart || config.runOnce) {
    await runAndSchedule(config.runOnce ? "manual_once" : "startup");
    return;
  }

  const next = nextRunDate(config.timeOfDay);
  console.log(`[market-price-daily-refresh] nextRun=${next.toISOString()} localTime=${config.timeOfDay}`);
  setTimeout(() => {
    void runAndSchedule("scheduled_daily_run");
  }, msUntil(next));
}

if (require.main === module) {
  scheduleLoop(readConfig()).catch((error) => {
    console.error("Fatal scheduler error:", error);
    process.exit(1);
  });
}

export { nextRunDate, readConfig, scheduleLoop };
