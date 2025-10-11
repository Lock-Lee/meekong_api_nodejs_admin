import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { UploadedFile } from "express-fileupload";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import fs from "fs/promises";
import slugify from "slugify";
import {
    IShopService,
    IShopRepository,
    ShopData,
    UpsertShopRequest,
    UploadShopImageResult
} from "../interfaces/shop.interfaces";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ShopService implements IShopService {
    constructor(
        @inject(TYPES.ShopRepository) private shopRepository: IShopRepository
    ) { }

    /**
     * Get shop by seller ID
     */
    async getShopBySellerId(sellerId: string): Promise<ShopData | null> {
        Logger.info("Fetching shop by seller ID", { sellerId });

        const shop = await this.shopRepository.findShopBySellerId(sellerId);

        if (!shop) {
            Logger.warn("Shop not found for seller", { sellerId });
            return null;
        }

        Logger.info("Shop retrieved successfully", { shopId: shop.id, sellerId });
        return shop;
    }

    /**
     * Create or update shop (Upsert)
     */
    async upsertShop(sellerId: string, request: UpsertShopRequest): Promise<ShopData> {
        Logger.info("Upserting shop", { sellerId });

        // 1. Validate request
        this.validateShopData(request);

        // 2. Check if shop exists
        const existingShop = await this.shopRepository.findShopBySellerId(sellerId);

        // 3. Upload images if provided
        let avatarUrl: string | undefined;
        let bannerUrl: string | undefined;

        if (request.avatarImage) {
            const uploadResult = await this.uploadShopImage(request.avatarImage, 'avatar');
            avatarUrl = uploadResult.imageUrl;
        }

        if (request.bannerImage) {
            const uploadResult = await this.uploadShopImage(request.bannerImage, 'banner');
            bannerUrl = uploadResult.imageUrl;
        }

        // 4. Create or Update shop
        if (existingShop) {
            // Update existing shop
            Logger.info("Updating existing shop", { shopId: existingShop.id, sellerId });

            const updateData: any = {};
            if (request.name) updateData.name = request.name;
            if (request.description !== undefined) updateData.description = request.description;
            if (avatarUrl) updateData.avatarUrl = avatarUrl;
            if (bannerUrl) updateData.bannerUrl = bannerUrl;

            const updatedShop = await this.shopRepository.updateShop(existingShop.id, updateData);

            Logger.info("Shop updated successfully", { shopId: updatedShop.id, sellerId });
            return updatedShop;
        } else {
            // Create new shop
            Logger.info("Creating new shop", { sellerId });

            const slug = this.generateSlug(request.name);

            const newShop = await this.shopRepository.createShop({
                name: request.name,
                description: request.description,
                slug,
                avatarUrl,
                bannerUrl,
                sellerId,
            });

            Logger.info("Shop created successfully", { shopId: newShop.id, sellerId });
            return newShop;
        }
    }

    /**
     * Upload shop image
     */
    async uploadShopImage(image: UploadedFile, type: 'avatar' | 'banner'): Promise<UploadShopImageResult> {
        Logger.info("Uploading shop image", {
            filename: image.name,
            size: image.size,
            type
        });

        // Validate image
        this.validateImageFile(image);

        const uploadPath = path.join(process.cwd(), `public/images/shops/${type}s`);
        await fs.mkdir(uploadPath, { recursive: true });

        const newImageId = uuidv7();
        const fileExtension = path.extname(image.name);
        const newFileName = `${newImageId}${fileExtension}`;
        const filePath = path.join(uploadPath, newFileName);

        await image.mv(filePath);

        const imageUrl = `/images/shops/${type}s/${newFileName}`;

        Logger.info("Shop image uploaded successfully", {
            filename: newFileName,
            imageUrl,
            type
        });

        return {
            imageUrl,
            filePath,
            imageId: newImageId,
        };
    }

    /**
     * Validate shop data
     */
    validateShopData(data: UpsertShopRequest): void {
        if (!data.name || data.name.trim().length === 0) {
            throw new ValidationError("Shop name is required");
        }

        if (data.name.length > 100) {
            throw new ValidationError("Shop name must be less than 100 characters");
        }

        if (data.description && data.description.length > 1000) {
            throw new ValidationError("Shop description must be less than 1000 characters");
        }
    }

    // Private helper methods
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

    private generateSlug(name: string): string {
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
            locale: 'th',
        });

        // Add random suffix to ensure uniqueness
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${baseSlug}-${randomSuffix}`;
    }
}
