import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import {
    IBuyerReviewRepository,
    BuyerReviewData,
    CreateBuyerReviewRequest,
    FindBuyerReviewParams,
    UpdateBuyerReviewRequest
} from "../../business/interfaces/buyer-review.interfaces";


@injectable()
export class BuyerReviewRepository implements IBuyerReviewRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    async createBuyerReview(data: CreateBuyerReviewRequest): Promise<BuyerReviewData> {

        const ratingNum = typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating;

        const newReview = await this.prisma.shopReview.create({
            data: {
                shopId: data.shopId,
                userId: data.userId,
                rating: ratingNum,
                comment: data.comment,
                images: data.images,
                status: data.status || 'APPROVED', // Default status if not provided
                createdAt: data.createdAt,
            }
        });

        return this.mapToBuyerReviewCreateData(newReview);
    }
    private mapToBuyerReviewCreateData(review: any): BuyerReviewData {
        return {
            id: review.id,
            shopId: review.shopId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            status: review.status,
            createdAt: review.createdAt,
        };
    }
    private mapToBuyerReviewData(review: any): BuyerReviewData {
        return {
            id: review.id,
            shopId: review.shopId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            status: review.status,
            createdAt: review.createdAt,
            user: {
                id: review.user.id,
                profile: {
                    avatarUrl: review.user.profile.avatarUrl,
                    firstName: review.user.profile.firstName,
                    lastName: review.user.profile.lastName,
                },
            },
        };
    }


    // In buyerReview.repository.ts
    async findAllBuyerReviewPaged(params: FindBuyerReviewParams = {}): Promise<BuyerReviewData[]> {
        const { take = 20, skip = 0, userId, shopId } = params;

        const where = {
            ...(userId ? { userId } : {}),
            ...(shopId ? { shopId } : {}),
        };

        const rows = await this.prisma.shopReview.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shopId: true,
                userId: true,
                rating: true,
                comment: true,
                images: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                avatarUrl: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            }
        });

        return rows.map((r: BuyerReviewData) => this.mapToBuyerReviewData(r));
    }

    async findBuyerReviewById(id: string): Promise<BuyerReviewData | null> {
        const review = await this.prisma.shopReview.findUnique({
            where: { id },
            select: {
                id: true,
                shopId: true,
                userId: true,
                rating: true,
                comment: true,
                images: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                avatarUrl: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            }
        });
        if (!review) {
            return null;
        }
        return this.mapToBuyerReviewData(review);
    }

    async updateBuyerReview(id: string, data: UpdateBuyerReviewRequest): Promise<BuyerReviewData> {
        const updatedReview = await this.prisma.shopReview.update({
            where: { id },
            data: {
                rating: data.rating,
                comment: data.comment,
                images: data.images,
                status: data.status,
            },
        });
        return this.mapToBuyerReviewData(updatedReview);
    }
    async deleteBuyerReview(id: string): Promise<void> {
        await this.prisma.shopReview.delete({ where: { id } });
    }
}
