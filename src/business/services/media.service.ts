import { inject, injectable } from "inversify";
import { TYPES } from "@shared/types/service.types";
import { MediaType } from "../../../generated/prisma";
import { BusinessError } from "@shared/errors/business.errors";
import {
    CompleteUploadRequest,
    IMediaRepository,
    IMediaService,
    IS3PresignService,
    MediaRecord,
    PresignRequest,
    PresignResponse,
} from "@business/interfaces/media.interfaces";
import { queues, defaultJobOpts } from "@shared/infra/queues/bullmq";

@injectable()
export class MediaService implements IMediaService {
    constructor(
        @inject(TYPES.MediaRepository) private readonly mediaRepository: IMediaRepository,
        @inject(TYPES.S3PresignService) private readonly s3Presign: IS3PresignService
    ) { }

    async listItemMedia(itemId: string): Promise<MediaRecord[]> {
        return this.mediaRepository.listItemMedia(itemId);
    }

    async presignUpload(request: PresignRequest): Promise<PresignResponse> {
        const { itemId, type, contentType, fileName, size, userId } = request;

        // Ownership guard
        const isOwner = await this.mediaRepository.isItemOwnedBy(itemId, userId);
        if (!isOwner) {
            throw new BusinessError("You do not own this item", "FORBIDDEN");
        }

        if (type === MediaType.IMAGE) {
            const count = await this.mediaRepository.countImages(itemId);
            if (count >= 10) {
                throw new BusinessError("Maximum 10 images per item", "VALIDATION_ERROR");
            }
            if (!contentType.startsWith("image/")) {
                throw new BusinessError("Invalid image content type", "VALIDATION_ERROR");
            }
            if (size > 10 * 1024 * 1024) {
                throw new BusinessError("Image exceeds 10MB limit", "VALIDATION_ERROR");
            }
            const key = `items/${itemId}/images/${fileName}`;
            const { url, headers } = await this.s3Presign.presignSingle(key, contentType, 10 * 1024 * 1024);
            return { key, uploadUrl: url, headers };
        }

        // VIDEO
        const hasVideo = await this.mediaRepository.hasVideo(itemId);
        if (hasVideo) {
            throw new BusinessError("Item already has a video", "VALIDATION_ERROR");
        }
        if (!contentType.startsWith("video/")) {
            throw new BusinessError("Invalid video content type", "VALIDATION_ERROR");
        }
        if (size > 100 * 1024 * 1024) {
            throw new BusinessError("Video exceeds 100MB limit", "VALIDATION_ERROR");
        }

        const key = `items/${itemId}/video/${fileName}`;
        // Keep single-part for 100MB max for simplicity; can extend to multipart later
        const { url, headers } = await this.s3Presign.presignSingle(key, contentType, 100 * 1024 * 1024);
        return { key, uploadUrl: url, headers };
    }

    async completeUpload(request: CompleteUploadRequest): Promise<MediaRecord> {
        const { itemId, type, key, userId } = request;

        // Ownership guard
        const isOwner = await this.mediaRepository.isItemOwnedBy(itemId, userId);
        if (!isOwner) {
            throw new BusinessError("You do not own this item", "FORBIDDEN");
        }
        // Store only the S3 key path, not the full URL
        const storedPath = key;

        if (type === MediaType.IMAGE) {
            const currentCount = await this.mediaRepository.countImages(itemId);
            if (currentCount >= 10) {
                throw new BusinessError("Maximum 10 images per item", "VALIDATION_ERROR");
            }
            // First image becomes primary by default
            const record = await this.mediaRepository.createImage(itemId, storedPath, currentCount === 0, userId);
            // enqueue image process (square crops) - workers need full URL
            const fullUrl = `https://${process.env.S3_BUCKET || 'meekong-media-dev'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
            await queues.imageProcess.add("image-process", {
                itemId,
                imageUrl: fullUrl,
                key,
                imageId: record.id
            }, defaultJobOpts);
            return record;
        }

        // VIDEO: ensure only one
        const hasVideo = await this.mediaRepository.hasVideo(itemId);
        if (hasVideo) {
            throw new BusinessError("Item already has a video", "VALIDATION_ERROR");
        }
        const record = await this.mediaRepository.createVideo(itemId, storedPath, userId);
        // enqueue video validation (duration) - workers need full URL
        const fullUrl = `https://${process.env.S3_BUCKET || 'meekong-media-dev'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        await queues.videoValidate.add("video-validate", {
            itemId,
            videoUrl: fullUrl,
            key,
            videoId: record.id
        }, defaultJobOpts);
        return record;
    }

    async deleteMedia(mediaId: string, userId: string): Promise<void> {
        const owned = await this.mediaRepository.getMediaOwnership(mediaId);
        if (!owned) {
            throw new BusinessError("Media not found", "NOT_FOUND");
        }
        if (owned.sellerId !== userId) {
            throw new BusinessError("You do not own this media", "FORBIDDEN");
        }
        // Optional: delete from S3 (future); for now delete DB record
        await this.mediaRepository.deleteMedia(mediaId);
    }

    async setPrimaryImage(itemId: string, imageId: string, userId: string): Promise<void> {
        const isOwner = await this.mediaRepository.isItemOwnedBy(itemId, userId);
        if (!isOwner) {
            throw new BusinessError("You do not own this item", "FORBIDDEN");
        }
        await this.mediaRepository.setPrimary(itemId, imageId, userId);
    }
}


