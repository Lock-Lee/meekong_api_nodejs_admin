import { Logger } from "../shared/utils/logger";

export type Job = () => Promise<void> | void;

/**
 * Start a simple minute-aligned scheduler and execute the provided jobs every minute.
 * - Aligns the first run to the start of the next minute (seconds/ms = 0)
 */
export function startScheduler(jobs: Job[]) {
  const runAll = async () => {
    for (const job of jobs) {
      try {
        await job();
      } catch (err: any) {
        Logger.error("Job execution error", { error: err?.message || String(err) });
      }
    }
  };

  // Align to next minute boundary
  const now = new Date();
  const delayToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    // First run
    runAll();
    // Then run every minute
    setInterval(runAll, 60 * 1000);
  }, Math.max(0, delayToNextMinute));

  Logger.info("Scheduler started (every 1 minute, aligned to minute).");
}
