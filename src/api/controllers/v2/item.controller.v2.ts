import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "@shared/types/service.types";
import { IItemService } from "@business/interfaces/item.interfaces";
import Send from "@utils/response.utils";
import { Logger } from "@utils/logger";
import { BusinessError } from "@shared/errors/business.errors";
import { createItemV2BodySchema, updateItemV2BodySchema } from "@api/schemas/item.v2.schemas";

@injectable()
export default class ItemControllerV2 {
    constructor(
        @inject(TYPES.ItemService) private readonly itemService: IItemService
    ) { }

    create = async (req: Request, res: Response) => {
        try {
            const bodyValidation = createItemV2BodySchema.safeParse(req.body);
            if (!bodyValidation.success) {
                return Send.error(res, bodyValidation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const createRequest = {
                ...bodyValidation.data,
                images: [],
            } as any;

            const item = await this.itemService.createItem(createRequest, userId);
            return Send.success(res, item, "Item created successfully.");
        } catch (error) {
            Logger.error("Error creating item (v2)", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to create item.");
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const bodyValidation = updateItemV2BodySchema.safeParse(req.body);
            if (!bodyValidation.success) {
                return Send.error(res, bodyValidation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }
            const { id } = req.params;
            const item = await this.itemService.updateItem(id, bodyValidation.data as any, userId);
            return Send.success(res, item, "Item updated successfully.");
        } catch (error) {
            Logger.error("Error updating item (v2)", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to update item.");
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const item = await this.itemService.getItemDetails(id, userId);
            return Send.success(res, item, "Item retrieved successfully.");
        } catch (error) {
            Logger.error("Error getting item (v2)", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Item not found.", 404);
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }
            await this.itemService.deleteItem(id, userId);
            return Send.success(res, null, "Item deleted successfully.");
        } catch (error) {
            Logger.error("Error deleting item (v2)", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to delete item.");
        }
    };
}


