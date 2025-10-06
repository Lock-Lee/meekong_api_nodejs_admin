import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    IBuyerShopService,
    IBuyerShopRepository,
    UserData,
    SearchItemWithImagesResult,
    BuyerReviewData
} from "../interfaces/buyer-shop.intetfaces";


@injectable()
export class BuyerShopService implements IBuyerShopService {
    constructor(
        @inject(TYPES.BuyerShopRepository) private buyerShopRepository: IBuyerShopRepository
    ) { }

    async getSellerProfileById(userId: string): Promise<UserData | null> {

        Logger.info("Getting seller profile by id", { userId });
        try {
            const sellerProfile = await this.buyerShopRepository.findSellerProfileById(userId);

            Logger.info("Seller profile retrieved successfully", { userId, sellerProfile });
            return sellerProfile;
        } catch (error) {
            Logger.error("Failed to get seller profile", { userId, error });
            throw new BusinessError("Failed to get seller profile");

        }
    }

    async getItemsBySellerId(
        userId: string,
        keyword?: string ,
        categoryId?: string[],
        sellType?: string[],
        itemType?: string[],
        minPrice?: number,
        maxPrice?: number,
        page?: number,
        take?: number,
        sortBy?: "createdAt" | "priceMin" | "priceMax",
        sortOrder?: "asc" | "desc"
    ): Promise<SearchItemWithImagesResult[]> {
        Logger.info("Getting items by seller id", { userId });
        try {
            const items = await this.buyerShopRepository.findItemsBySellerId(
                userId,
                keyword,
                categoryId,
                sellType,
                itemType,
                minPrice,
                maxPrice,
                page,
                take,
                sortBy,
                sortOrder
            );
            return items;
        } catch (error) {
            Logger.error("Failed to get items by seller id", { userId, error });
            throw new BusinessError("Failed to get items by seller id");
        }
    }
    async getCategoryBySellerId(userId: string): Promise<{ categoryId: string; categoryName: string; count: number }[]> {
        Logger.info("Getting category by seller id", { userId });
        try {
            const category = await this.buyerShopRepository.findCategoryBySellerId(userId);
            return category
        } catch (error) {
            Logger.error("Failed to get category by seller id", { userId, error });
            throw new BusinessError("Failed to get category by seller id");
        }
    }

    async getAllBuyerReview(userId: string, shopId: string): Promise<BuyerReviewData[]> {
        Logger.info("Getting category by seller id", { userId });
        try {
            const category = await this.buyerShopRepository.findBuyerReviewBySellerId(userId,shopId);
            return category
        } catch (error) {
            Logger.error("Failed to get category by seller id", { userId, error });
            throw new BusinessError("Failed to get category by seller id");
        }
    }
}
