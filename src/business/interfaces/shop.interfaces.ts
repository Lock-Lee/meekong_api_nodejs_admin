import { UploadedFile } from "express-fileupload";
import { Status } from "../../../generated/prisma";

export interface ShopData {
    id: string;
    name: string;
    description?: string;
    slug: string;
    avatarUrl?: string;
    bannerUrl?: string;
    sellerId: string;
    averageRating: number;
    totalReviews: number;
    views: number;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpsertShopRequest {
    name: string;
    description?: string;
    avatarImage?: UploadedFile;
    bannerImage?: UploadedFile;
}

export interface UploadShopImageResult {
    imageUrl: string;
    filePath: string;
    imageId: string;
}

/**
 * Repository interface for shop-related data operations
 */
export interface IShopRepository {
    // Shop operations
    findShopBySellerId(sellerId: string): Promise<ShopData | null>;
    findShopById(id: string): Promise<ShopData | null>;
    createShop(data: {
        name: string;
        description?: string;
        slug: string;
        avatarUrl?: string;
        bannerUrl?: string;
        sellerId: string;
    }): Promise<ShopData>;
    updateShop(id: string, data: {
        name?: string;
        description?: string;
        avatarUrl?: string;
        bannerUrl?: string;
    }): Promise<ShopData>;
}

/**
 * Service interface for shop business logic
 */
export interface IShopService {
    // Shop operations
    getShopBySellerId(sellerId: string): Promise<ShopData | null>;
    upsertShop(sellerId: string, request: UpsertShopRequest): Promise<ShopData>;

    // Image operations
    uploadShopImage(image: UploadedFile, type: 'avatar' | 'banner'): Promise<UploadShopImageResult>;

    // Validation
    validateShopData(data: UpsertShopRequest): void;
}
