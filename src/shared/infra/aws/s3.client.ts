import { S3Client } from "@aws-sdk/client-s3";

export function createS3Client() {
    const isLocalDevelopment = process.env.NODE_ENV !== 'production';

    const config: any = {
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || (isLocalDevelopment ? 'test' : ''),
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || (isLocalDevelopment ? 'test' : ''),
        },
    };

    // LocalStack configuration for development (default to LocalStack if not in production)
    if (process.env.S3_ENDPOINT || isLocalDevelopment) {
        config.endpoint = process.env.S3_ENDPOINT || 'http://localhost:4566';
        config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || isLocalDevelopment;
    }

    return new S3Client(config);
}


