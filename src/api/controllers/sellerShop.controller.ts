import { ISellerShopService } from "@business/interfaces/seller-shop.intetfaces";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "@utils/logger";
import Send from "@utils/response.utils";
import { Request, Response } from "express";
import { injectable } from "inversify";

@injectable()
export class SellerShopController {
    private sellerShopService: ISellerShopService;
    constructor() {
        this.sellerShopService = container.get<ISellerShopService>(TYPES.SellerShopService);

    }

    async getItemsBySellerId(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.query.userId as string) || "";
            if (!userId) {
                return Send.error(res, null, "userId is required", 400);
            }



            const keyword = (req.query.keyword as string) || "";
            const rawCategoryId = req.query.categoryId as undefined | string | string[];
            let categoryId: string[] = [];
            if (Array.isArray(rawCategoryId)) {
                categoryId = rawCategoryId.filter((v) => typeof v === "string" && v.trim().length > 0);
            } else if (typeof rawCategoryId === "string" && rawCategoryId.trim().length > 0) {
                categoryId = rawCategoryId.split(",").map((s) => s.trim()).filter(Boolean);
            }


            const rawSellType = req.query.sellType as undefined | string | string[];
            let sellType: string[] = [];
            if (Array.isArray(rawSellType)) {
                sellType = rawSellType.filter((v) => typeof v === "string" && v.trim().length > 0);
            } else if (typeof rawSellType === "string" && rawSellType.trim().length > 0) {
                sellType = rawSellType.split(",").map((s) => s.trim()).filter(Boolean);
            }

            const rawItemType = req.query.itemType as undefined | string | string[];
            let itemType: string[] = [];
            if (Array.isArray(rawItemType)) {
                itemType = rawItemType.filter((v) => typeof v === "string" && v.trim().length > 0);
            } else if (typeof rawItemType === "string" && rawItemType.trim().length > 0) {
                itemType = rawItemType.split(",").map((s) => s.trim()).filter(Boolean);
            }



            const rawMinPrice = req.query.minPrice as undefined | string;
            const rawMaxPrice = req.query.maxPrice as undefined | string;
            let minPrice: number | undefined;
            let maxPrice: number | undefined;
            if (rawMinPrice !== undefined) {
                minPrice = Number(rawMinPrice);
            }
            if (rawMaxPrice !== undefined) {
                maxPrice = Number(rawMaxPrice);
            }


            const rawPage = req.query.page as undefined | string;
            const rawTake = req.query.take as undefined | string;
            let page: number = 1;
            let take: number = 20;
            if (rawPage !== undefined) {
                page = Number(rawPage);
            }
            if (rawTake !== undefined) {
                take = Number(rawTake);
            }

     

            Logger.info("Fetching items by seller ID", { requestId: req.id, userId });
            // Sorting params
            const sortByRaw = req.query.sortBy as undefined | string;
            const sortOrderRaw = req.query.sortOrder as undefined | string;
            const allowedSortBy = new Set(["createdAt", "updatedAt", "price"]);
            const allowedSortOrder = new Set(["asc", "desc"]);
            const sortBy = sortByRaw && allowedSortBy.has(sortByRaw) ? (sortByRaw as any) : undefined;
            const sortOrder = sortOrderRaw && allowedSortOrder.has(sortOrderRaw) ? (sortOrderRaw as any) : undefined;
            const status = req.query.status as undefined | string;

            const auctionStatus = req.query.auctionStatus as undefined | string;
            const satisfyStatus = req.query.satisfyStatus as undefined | string;
            const itemId = req.query.itemId as undefined | string;

            const items = await this.sellerShopService.getItemsBySellerId(
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

            const extra = {
                countAll: items.countAll,
                countActive: items.countActive,
                countInactive: items.countInactive,
                countDraft: items.countDraft,
            };
            return Send.success(res, items.items, "Items fetched successfully.", extra);
        } catch (error) {
            Logger.error("Failed to fetch items by seller ID", { requestId: req.id, error: error instanceof Error ? error.message : "Unknown error" });
            return Send.error(res, null, "Failed to fetch items by seller ID", 500);
        }
    }
}


