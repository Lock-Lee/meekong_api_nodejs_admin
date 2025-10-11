import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { IShopService } from "../../business/interfaces/shop.interfaces";
import shopSchema from "@schemas/shop.schemas";
import { UploadedFile } from "express-fileupload";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ShopController {
    private shopService: IShopService;

    constructor() {
        this.shopService = container.get<IShopService>(TYPES.ShopService);
    }

    /**
     * Get shop by seller ID
     */
    async getBySellerId(req: Request, res: Response): Promise<void> {
        try {
            const { sellerId } = req.params;

            Logger.info("Fetching shop by seller ID", { sellerId, requestId: req.id });

            const shop = await this.shopService.getShopBySellerId(sellerId);

            if (!shop) {
                Logger.warn("Shop not found", { sellerId, requestId: req.id });
                return Send.error(res, null, "Shop not found.");
            }

            Logger.info("Shop retrieved successfully", {
                shopId: shop.id,
                sellerId,
                requestId: req.id
            });

            return Send.success(res, shop, "Shop retrieved successfully.");
        } catch (error) {
            Logger.error("Failed to get shop", {
                error: (error as Error).message,
                sellerId: req.params?.sellerId,
                requestId: req.id
            });

            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }

            return Send.error(res, null, "Failed to retrieve shop.");
        }
    }

    /**
     * Upsert shop (Create or Update)
     */
    async upsert(req: Request, res: Response): Promise<void> {
        try {
            const { sellerId } = req.params;

            const bodyValidation = shopSchema.upsertShop.safeParse(req.body);
            if (!bodyValidation.success) {
                Logger.warn("Invalid request body for shop upsert", {
                    errors: bodyValidation.error.errors,
                    requestId: req.id
                });
                return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
            }

            const shopData = bodyValidation.data;
            const avatarImage = req.files?.avatarImage as UploadedFile | undefined;
            const bannerImage = req.files?.bannerImage as UploadedFile | undefined;

            Logger.info("Upserting shop", {
                sellerId,
                hasAvatarImage: !!avatarImage,
                hasBannerImage: !!bannerImage,
                requestId: req.id
            });

            const upsertRequest = {
                ...shopData,
                avatarImage,
                bannerImage,
            };

            const shop = await this.shopService.upsertShop(sellerId, upsertRequest);

            Logger.info("Shop upserted successfully", {
                shopId: shop.id,
                sellerId,
                requestId: req.id
            });

            return Send.success(res, shop, "Shop saved successfully.");
        } catch (error) {
            Logger.error("Failed to upsert shop", {
                error: (error as Error).message,
                sellerId: req.params?.sellerId,
                requestId: req.id
            });

            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }

            return Send.error(res, error, "An internal server error occurred.");
        }
    }
}

export default ShopController;
