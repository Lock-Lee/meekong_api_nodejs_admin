import { startScheduler } from "./scheduler";
import { runSatisfyExpirationJob } from "./satisfy-expiration.job";
import { runAuctionRefundJob } from "./auction-refund.job";

export function startJobs() {
  startScheduler([
    // every minute
    runSatisfyExpirationJob,
    runAuctionRefundJob,
  ]);
}
