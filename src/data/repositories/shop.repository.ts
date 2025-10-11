import { injectable } from "inversify";
import { PrismaClient } from "../../../generated/prisma";
import { IShopRepository, ShopData } from "../../business/interfaces/shop.interfaces";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ShopRepository implements IShopRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Find shop by seller ID
     */
    async findShopBySellerId(sellerId: string): Promise<ShopData | null> {
        try {
            Logger.info("Finding shop by seller ID", { sellerId });

            const shop = await this.prisma.shop.findFirst({
                where: { sellerId },
            });

            if (!shop) {
                Logger.info("Shop not found for seller", { sellerId });
                return null;
            }

            Logger.info("Shop found", { shopId: shop.id, sellerId });
            return this.mapToShopData(shop);
        } catch (error) {
            Logger.error("Error finding shop by seller ID", {
                error: (error as Error).message,
                sellerId
            });
            throw error;
        }
    }

    /**
     * Find shop by ID
     */
    async findShopById(id: string): Promise<ShopData | null> {
        try {
            Logger.info("Finding shop by ID", { shopId: id });

            const shop = await this.prisma.shop.findUnique({
                where: { id },
            });

            if (!shop) {
                Logger.info("Shop not found", { shopId: id });
                return null;
            }

            Logger.info("Shop found", { shopId: id });
            return this.mapToShopData(shop);
        } catch (error) {
            Logger.error("Error finding shop by ID", {
                error: (error as Error).message,
                shopId: id
            });
            throw error;
        }
    }

    /**
     * Create new shop
     */
    async createShop(data: {
        name: string;
        description?: string;
        slug: string;
        avatarUrl?: string;
        bannerUrl?: string;
        sellerId: string;
    }): Promise<ShopData> {
        try {
            Logger.info("Creating new shop", { sellerId: data.sellerId, name: data.name });

            const shop = await this.prisma.shop.create({
                data: {
                    name: data.name,
                    description: data.description,
                    slug: data.slug,
                    avatarUrl: data.avatarUrl,
                    bannerUrl: data.bannerUrl,
                    sellerId: data.sellerId,
                },
            });

            Logger.info("Shop created successfully", { shopId: shop.id });
            return this.mapToShopData(shop);
        } catch (error) {
            Logger.error("Error creating shop", {
                error: (error as Error).message,
                sellerId: data.sellerId
            });
            throw error;
        }
    }

    /**
     * Update existing shop
     */
    async updateShop(id: string, data: {
        name?: string;
        description?: string;
        avatarUrl?: string;
        bannerUrl?: string;
    }): Promise<ShopData> {
        try {
            Logger.info("Updating shop", { shopId: id });

            const shop = await this.prisma.shop.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    avatarUrl: data.avatarUrl,
                    bannerUrl: data.bannerUrl,
                },
            });

            Logger.info("Shop updated successfully", { shopId: id });
            return this.mapToShopData(shop);
        } catch (error) {
            Logger.error("Error updating shop", {
                error: (error as Error).message,
                shopId: id
            });
            throw error;
        }
    }

    /**
     * Map Prisma Shop to ShopData
     */
    private mapToShopData(shop: any): ShopData {
        return {
            id: shop.id,
            name: shop.name,
            description: shop.description,
            slug: shop.slug,
            avatarUrl: shop.avatarUrl,
            bannerUrl: shop.bannerUrl,
            sellerId: shop.sellerId,
            averageRating: parseFloat(shop.averageRating.toString()),
            totalReviews: shop.totalReviews,
            views: shop.views,
            status: shop.status,
            createdAt: shop.createdAt,
            updatedAt: shop.updatedAt,
        };
    }
}
