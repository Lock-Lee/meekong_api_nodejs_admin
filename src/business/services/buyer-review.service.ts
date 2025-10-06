import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { BusinessError, ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    IBuyerReviewService,
    IBuyerReviewRepository,
    BuyerReviewData,
    UpdateBuyerReviewRequest,
    UploadImageResult
} from "../interfaces/buyer-review.interfaces";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs/promises";
import { v7 as uuidv7 } from "uuid";

@injectable()
export class BuyerReviewService implements IBuyerReviewService {
    constructor(
        @inject(TYPES.BuyerReviewRepository) private buyerReviewRepository: IBuyerReviewRepository
    ) { }
    async getAllBuyerReview(userId: string, shopId: string): Promise<BuyerReviewData[]> {
        Logger.info("Getting all buyer reviews", { userId, shopId });
        return this.buyerReviewRepository.findAllBuyerReviewPaged({ userId, shopId });
    }

    async getBuyerReviewById(id: string): Promise<BuyerReviewData> {
        Logger.info("Getting buyer review by id", { id });
        const review = await this.buyerReviewRepository.findBuyerReviewById(id);
        if (!review) {
            throw new BusinessError("Buyer review not found");
        }

        return review;
    }
    async createBuyerReview(data: Omit<BuyerReviewData, 'id' | 'createdAt' | 'updatedAt' | 'images'> & { images?: UploadedFile | UploadedFile[] }): Promise<BuyerReviewData> {
        const { shopId, userId, rating, comment, images, status } = data;
        const imageUrls: string[] = [];

        if (images) {
            const files = Array.isArray(images) ? images : [images];
            for (const file of files) {
                const uploadResult = await this.uploadProfileImage(file);
                imageUrls.push(uploadResult.imageUrl);
            }
        }

        Logger.info("Creating buyer review", { shopId, userId, rating, comment, imageUrls, status });

        const newReview = await this.buyerReviewRepository.createBuyerReview({
            shopId,
            userId,
            rating,
            comment,
            images: imageUrls,
            createdAt: new Date(),
            status: 'APPROVED'
        });

        Logger.info("Buyer review created successfully", {
            buyerReviewId: newReview.id,
            shopId: newReview.shopId,
            userId: newReview.userId,
        });

        return newReview;
    }


    async uploadProfileImage(image: UploadedFile): Promise<UploadImageResult> {
        Logger.info("Uploading profile image", { filename: image.name, size: image.size });

        // Validate image
        this.validateImageFile(image);

        const uploadPath = path.join(process.cwd(), "public/images/reviews");
        await fs.mkdir(uploadPath, { recursive: true });

        const newImageId = uuidv7();
        const fileExtension = path.extname(image.name);
        const newFileName = `${newImageId}${fileExtension}`;
        const filePath = path.join(uploadPath, newFileName);

        await image.mv(filePath);

        const imageUrl = `/images/reviews/${newFileName}`;

        Logger.info("Profile image uploaded successfully", {
            filename: newFileName,
            imageUrl
        });

        return {
            imageUrl,
            filePath,
            imageId: newImageId,
        };
    }
    private validateImageFile(file: UploadedFile): void {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationError(
                `Invalid image format. Allowed formats: ${allowedTypes.join(', ')}`
            );
        }

        if (file.size > maxSize) {
            throw new ValidationError(
                `Image size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
            );
        }
    }
    async updateBuyerReview(id: string, data: UpdateBuyerReviewRequest): Promise<BuyerReviewData> {
        return this.buyerReviewRepository.updateBuyerReview(id, {
            rating: data.rating,
            comment: data.comment,
            images: data.images,
            status: data.status,
        });
    }

    async deleteBuyerReview(id: string): Promise<void> {
        return this.buyerReviewRepository.deleteBuyerReview(id);
    }

}
