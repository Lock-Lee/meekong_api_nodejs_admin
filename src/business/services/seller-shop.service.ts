import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    ISellerShopService,
    ISellerShopRepository,
    SearchItemsWithCounts,
    
} from "../interfaces/seller-shop.intetfaces";


@injectable()
export class SellerShopService implements ISellerShopService {
    constructor(
        @inject(TYPES.SellerShopRepository) private sellerShopRepository: ISellerShopRepository
    ) { }

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
        sortBy?: "createdAt" | "price" | "updatedAt",
        sortOrder?: "asc" | "desc",
        status?: string,
        auctionStatus?: string,
        satisfyStatus?: string,
        itemId?: string
    ): Promise<SearchItemsWithCounts> {
        Logger.info("Getting items by seller id", { userId });
        try {
            const items = await this.sellerShopRepository.findItemsBySellerId(
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
                sortOrder,
                status,
                auctionStatus,
                satisfyStatus,
                itemId
            );
            return items;
        } catch (error) {
            Logger.error("Failed to get items by seller id", { userId, error });
            throw new BusinessError("Failed to get items by seller id");
        }
    }
}