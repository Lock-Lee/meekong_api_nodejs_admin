import { inject, injectable } from "inversify";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TYPES } from "@shared/types/service.types";
import { IS3PresignService } from "@business/interfaces/media.interfaces";

@injectable()
export class S3PresignService implements IS3PresignService {
    constructor(@inject(TYPES.S3Client) private readonly s3: S3Client) { }

    async presignSingle(key: string, contentType: string, _maxBytes: number): Promise<{ url: string; headers: Record<string, string> }> {
        const bucket = process.env.S3_BUCKET || 'meekong-media-dev';
        const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
        const url = await getSignedUrl(this.s3, command, { expiresIn: 600 });
        // Caller should still validate size using client-side and server-side checks after upload
        return {
            url,
            headers: { "Content-Type": contentType },
        };
    }
}


