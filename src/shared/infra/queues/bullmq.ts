import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";

// Optimized Redis configuration for local development and EC2
const redisConfig = {
    // Connection retry configuration
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations

    // Connection timeout settings - more lenient for local dev
    connectTimeout: 10000,
    commandTimeout: 10000,
    lazyConnect: false,

    // Keep-alive settings
    keepAlive: 30000,

    // Error handling - allow offline queue for better reliability
    enableOfflineQueue: true,

    // Additional stability settings
    retryDelayOnClusterDown: 300,

    // Family preference for localhost
    family: 4,
};

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", redisConfig);

// Connection event handlers for EC2 Redis
connection.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

connection.on("ready", () => {
    console.log("🚀 Redis ready for operations");
});

connection.on("error", (error: Error) => {
    console.error("❌ Redis connection error:", error.message);
    // Don't exit process on Redis errors - let it retry
});

connection.on("close", () => {
    console.log("🔌 Redis connection closed");
});

connection.on("reconnecting", (ms: number) => {
    console.log(`🔄 Redis reconnecting in ${ms}ms...`);
});

connection.on("end", () => {
    console.log("🔚 Redis connection ended");
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Redis connection...');
    await connection.quit();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down Redis connection...');
    await connection.quit();
    process.exit(0);
});

export const redisConnection = connection;

export const queues = {
    imageProcess: new Queue("image-process", { connection }),
    videoValidate: new Queue("video-validate", { connection }),
};

export type ImageProcessJobData = {
    itemId: string;
    imageUrl: string; // s3 url
    key: string; // s3 key
    imageId: string; // database record id
};

export type VideoValidateJobData = {
    itemId: string;
    videoUrl: string; // s3 url
    key: string; // s3 key
    videoId: string; // database record id
};

export const defaultJobOpts: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
};

export function createQueueEvents() {
    return {
        imageProcess: new QueueEvents("image-process", { connection }),
        videoValidate: new QueueEvents("video-validate", { connection }),
    };
}


