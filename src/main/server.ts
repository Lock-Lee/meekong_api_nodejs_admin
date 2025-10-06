import "dotenv/config";

import App from "./app";
import { startMediaWorker } from "../workers/media.worker";
import { Logger } from "../shared/utils/logger";

// Global error handlers
process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    Logger.error('Unhandled Rejection at:', {
        promise: promise.toString(),
        reason: reason instanceof Error ? reason.message : String(reason)
    });
    process.exit(1);
});

const app = new App();
app.start();

if (process.env.ENABLE_WORKERS === "true") {
    startMediaWorker();
}
