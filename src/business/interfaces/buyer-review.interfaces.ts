import { reviewStatus } from "../../../generated/prisma";
import { UploadedFile } from "express-fileupload";


export interface BuyerReviewData {
    id: string;
    shopId: string;
    userId: string;
    rating?: number;
    comment?: string;
    images?: string[];
    status: reviewStatus;
    createdAt?: Date;
    user?: {
        id: string;
        profile: {
            avatarUrl: string;
            firstName: string;
            lastName: string;
        };
    };
}

export interface CreateBuyerReviewRequest {
    shopId: string;
    userId: string;
    rating?: number;
    comment?: string;
    images?: string[];
    status?: reviewStatus;
    createdAt?: Date;
}
export interface UpdateBuyerReviewRequest {
    rating?: number;
    comment?: string;
    images?: string[];
    status?: reviewStatus;
}
export interface FindBuyerReviewParams {
    userId?: string;
    shopId?: string;
    take?: number;
    skip?: number;
}
export interface UploadImageResult {
    imageUrl: string;
    filePath: string;
    imageId: string;
}

export interface IBuyerReviewRepository {
    createBuyerReview(data: CreateBuyerReviewRequest): Promise<BuyerReviewData>;
    findAllBuyerReviewPaged(params: FindBuyerReviewParams): Promise<BuyerReviewData[]>;
    findBuyerReviewById(id: string): Promise<BuyerReviewData | null>;
    updateBuyerReview(id: string, data: UpdateBuyerReviewRequest): Promise<BuyerReviewData>;
    deleteBuyerReview(id: string): Promise<void>;
}

export interface IBuyerReviewService {
    createBuyerReview(data: Omit<BuyerReviewData, 'id' | 'createdAt' | 'updatedAt' | 'images'> & { images?: UploadedFile | UploadedFile[] }): Promise<BuyerReviewData>;
    getAllBuyerReview(userId: string, shopId: string): Promise<BuyerReviewData[]>;
    getBuyerReviewById(id: string): Promise<BuyerReviewData>;
    updateBuyerReview(id: string, data: UpdateBuyerReviewRequest): Promise<BuyerReviewData>;
    deleteBuyerReview(id: string): Promise<void>;
}
