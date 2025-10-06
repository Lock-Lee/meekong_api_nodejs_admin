import { Worker, Job } from "bullmq";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
const ffprobe = require("ffprobe-static");
import { exec } from "child_process";
import { promisify } from "util";
import { redisConnection } from "../shared/infra/queues/bullmq";

const execAsync = promisify(exec);
const connection = redisConnection;

// S3 client for worker operations  
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    ...(process.env.S3_ENDPOINT && {
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
    }),
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    })
});

const BUCKET_NAME = process.env.S3_BUCKET || "meekong-media";

interface ImageJobData {
    itemId: string;
    imageUrl: string;
    key: string;
    imageId: string;
}

interface VideoJobData {
    itemId: string;
    videoUrl: string;
    key: string;
    videoId: string;
}

// Image pipeline: create 1:1 square crops in different sizes
const imageWorker = new Worker("image-process", async (job: Job<ImageJobData>) => {
    const { key, itemId, imageUrl } = job.data;

    try {
        console.log(`Processing image: ${key} for item: ${itemId}`);

        // Download original image from S3
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(getCommand);
        const imageBuffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);

        // Create 1:1 square crops in different sizes
        const sizes = [512, 1024];
        const uploadPromises = [];

        for (const size of sizes) {
            const processedBuffer = await sharp(imageBuffer)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 85 })
                .toBuffer();

            // Generate derived key
            const pathParts = key.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const nameWithoutExt = fileName.split('.')[0];
            const derivedKey = `${pathParts.slice(0, -1).join('/')}/${nameWithoutExt}_${size}x${size}.webp`;

            // Upload processed image
            const putCommand = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: derivedKey,
                Body: processedBuffer,
                ContentType: 'image/webp',
                Metadata: {
                    'original-key': key,
                    'item-id': itemId,
                    'image-url': imageUrl,
                    'size': size.toString(),
                    'processed-at': new Date().toISOString()
                }
            });

            uploadPromises.push(s3Client.send(putCommand));
        }

        await Promise.all(uploadPromises);

        console.log(`Successfully processed image ${key} into ${sizes.length} sizes`);
        return {
            key,
            itemId,
            processedSizes: sizes,
            status: 'completed'
        };

    } catch (error) {
        console.error(`Error processing image ${key}:`, error);
        throw error;
    }
}, {
    connection,
    concurrency: 3
});

// Video pipeline: validate duration < 60s
const videoWorker = new Worker("video-validate", async (job: Job<VideoJobData>) => {
    const { key, itemId, videoUrl } = job.data;

    try {
        console.log(`Validating video: ${key} for item: ${itemId}`);

        // Use the provided video URL for ffprobe access

        // Use ffprobe to get video metadata
        const ffprobeCommand = `"${ffprobe}" -v quiet -show_entries format=duration -of csv=p=0 "${videoUrl}"`;

        const { stdout } = await execAsync(ffprobeCommand);
        const duration = parseFloat(stdout.trim());

        if (isNaN(duration)) {
            throw new Error('Could not determine video duration');
        }

        if (duration > 60) {
            throw new Error(`Video duration ${duration}s exceeds 60 second limit`);
        }

        console.log(`Video ${key} validation passed: ${duration}s duration`);

        // Optional: Generate video poster/thumbnail
        // For now, we'll skip this to keep implementation focused

        return {
            key,
            itemId,
            duration,
            status: 'valid'
        };

    } catch (error) {
        console.error(`Error validating video ${key}:`, error);
        throw error;
    }
}, {
    connection,
    concurrency: 2
});

// Helper function to convert stream to buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

// Define result types for workers
interface ImageProcessResult {
    key: string;
    itemId: string;
    processedSizes: number[];
    status: string;
}

interface VideoValidateResult {
    key: string;
    itemId: string;
    duration: number;
    status: string;
}

// Worker event handlers for monitoring
imageWorker.on('completed', (job: Job<ImageJobData>, result: ImageProcessResult) => {
    console.log(`Image job ${job.id} completed:`, result);
});

imageWorker.on('failed', (job: Job<ImageJobData> | undefined, err: Error) => {
    console.error(`Image job ${job?.id} failed:`, err);
});

videoWorker.on('completed', (job: Job<VideoJobData>, result: VideoValidateResult) => {
    console.log(`Video job ${job.id} completed:`, result);
});

videoWorker.on('failed', (job: Job<VideoJobData> | undefined, err: Error) => {
    console.error(`Video job ${job?.id} failed:`, err);
});

// Export function to start workers
export function startMediaWorker() {
    console.log("Media workers started - Image and Video processing enabled");
    return { imageWorker, videoWorker };
}