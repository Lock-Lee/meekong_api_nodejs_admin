import { Request, Response } from "express";
import Send from "../../shared/utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IItemService } from "../../business/interfaces/item.interfaces";
import { CreateItemVariant } from "../../business/interfaces/item.interfaces";
import {
  createItemBodySchema,
  updateItemBodySchema,
  searchItemsQuerySchema,
  listItemsQuerySchema,
  searchSuggestionsQuerySchema,
  updateItemVariantBodySchema,
  updateVariantAuctionItemBodySchema,
} from "../schemas/item.schemas";
import { UploadedFile } from "express-fileupload";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ItemController {
  constructor(
    @inject(TYPES.ItemService) private readonly itemService: IItemService
  ) {}

  /**
   * Create a new item
   */
  create = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const bodyValidation = createItemBodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return Send.error(
          res,
          bodyValidation.error.issues,
          "Invalid request data.",
          400
        );
      }

      // 2. Get authenticated user ID
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "Authentication required.", 401);
      }

      // 3. Get uploaded files
      const images = req.files?.images as
        | UploadedFile[]
        | UploadedFile
        | undefined;
      const imageArray = images
        ? Array.isArray(images)
          ? images
          : [images]
        : [];

      const variantImages: UploadedFile[] = [];

      if (req.files) {
        Object.entries(req.files).forEach(([key, file]) => {
          if (key.startsWith("variantImages[")) {
            const match = key.match(/\[(\d+)\]/); // ดึง index จากชื่อ field เช่น [0]
            if (match) {
              const index = parseInt(match[1], 10);
              variantImages[index] = file as UploadedFile;
            }
          }
        });
      }

      // 4️⃣ ผูกภาพเข้ากับแต่ละ variant
      const variantsWithImages = bodyValidation.data.itemVariants.map(
        (variant: CreateItemVariant, index: number) => ({
          ...variant,
          images: variantImages[index] || null, // ถ้าไม่มีรูป ให้ null
        })
      );

      // 4. Prepare create request
      const createRequest: any = {
        ...bodyValidation.data,
        images: imageArray,
        itemVariants: variantsWithImages,
      };

      // 5. Create item through business service
      const item = await this.itemService.createItem(createRequest, userId);

      // 6. Log business operation
      Logger.business("item_created", {
        requestId: (req as any).requestId,
        userId,
        itemId: item.id,
        itemType: item.itemType,
        sellType: item.sellType,
      });

      return Send.success(res, item, "Item created successfully.");
    } catch (error) {
      Logger.error("Error creating item", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        body: req.body,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to create item.");
    }
  };

  /**
   * Search items with filters
   */
  search = async (req: Request, res: Response) => {
    try {
      // 1. Validate query parameters
      const validation = searchItemsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters.",
          400
        );
      }

      // 2. Get optional user ID for personalized results
      const userId = req.userId;

      // 3. Search through business service
      const searchRequest = {
        ...validation.data,
        userId,
      };

      const result = await this.itemService.searchItems(searchRequest);

      // 4. Log search operation
      Logger.info("item_search", {
        requestId: (req as any).requestId,
        userId,
        keyword: validation.data.keyword,
        filters: validation.data,
        resultCount: result.items.length,
      });

      return Send.success(res, result, "Items retrieved successfully.");
    } catch (error) {
      Logger.error("Error searching items", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        query: req.query,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to search items.");
    }
  };

  /**
   * Get item details by ID
   */
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;
      const item = await this.itemService.getItemDetails(id, userId);

      Logger.info("item_view", {
        requestId: (req as any).requestId,
        userId,
        itemId: id,
      });

      return Send.success(res, item, "Item retrieved successfully.");
    } catch (error) {
      Logger.error("Error getting item", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        itemId: req.params.id,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Item not found.", 404);
    }
  };

  /**
   * Update an existing item
   */
  update = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const bodyValidation = updateItemBodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return Send.error(
          res,
          bodyValidation.error.issues,
          "Invalid request data.",
          400
        );
      }

      // 2. Get authenticated user ID
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "Authentication required.", 401);
      }

      // 3. Get item ID from params
      const { id } = req.params;

      // 4. Get uploaded files if any
      const images = req.files?.images as
        | UploadedFile[]
        | UploadedFile
        | undefined;
      const imageArray = images
        ? Array.isArray(images)
          ? images
          : [images]
        : [];

      // 5. Prepare update request
      const updateRequest = {
        ...bodyValidation.data,
        images: imageArray.length > 0 ? imageArray : undefined,
      };

      const variantImages: UploadedFile[] = [];

      if (req.files) {
        Object.entries(req.files).forEach(([key, file]) => {
          if (key.startsWith("variantImages[")) {
            const match = key.match(/\[(\d+)\]/); // ดึง index จากชื่อ field เช่น [0]
            if (match) {
              const index = parseInt(match[1], 10);
              variantImages[index] = file as UploadedFile;
            }
          }
        });
      }

      // 4️⃣ ผูกภาพเข้ากับแต่ละ variant
      const variantsWithImages = bodyValidation.data.itemVariants.map(
        (variant: CreateItemVariant, index: number) => ({
          ...variant,
          images: variantImages[index] || null, // ถ้าไม่มีรูป ให้ null
        })
      );

      updateRequest.itemVariants = variantsWithImages;

      // 6. Update item through business service
      const item = await this.itemService.updateItem(id, updateRequest, userId);

      Logger.business("item_updated", {
        requestId: (req as any).requestId,
        userId,
        itemId: id,
      });

      return Send.success(res, item, "Item updated successfully.");
    } catch (error) {
      Logger.error("Error updating item", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        itemId: req.params.id,
        body: req.body,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update item.");
    }
  };

  /**
   * Delete an item
   */
  delete = async (req: Request, res: Response) => {
    try {
      const itemId = req.params.itemId;
      const status = req.query.status as string;
      const userId = req.userId || "";

      await this.itemService.deleteItem(itemId, userId, status);

      Logger.business("item_deleted", {
        requestId: (req as any).requestId,
        itemId: itemId,
        status: status,
      });

      return Send.success(res, null, "Item deleted successfully.");
    } catch (error) {
      Logger.error("Error deleting item", error, {
        requestId: (req as any).requestId,
        itemId: req.params.itemId,
        status: req.query.status,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to delete item.");
    }
  };

  /**
   * Get all items with pagination
   */
  getAll = async (req: Request, res: Response) => {
    try {
      // 1. Validate query parameters
      const validation = listItemsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters.",
          400
        );
      }

      // 2. Convert to search request
      const searchRequest = {
        sellType: validation.data.sellType,
        userId: validation.data.userId,
        page: validation.data.page,
      };

      // 3. Get items through business service
      const result = await this.itemService.searchItems(searchRequest);

      return Send.success(res, result, "Items retrieved successfully.");
    } catch (error) {
      Logger.error("Error getting items", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        query: req.query,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve items.");
    }
  };

  /**
   * Update item variant (price and stock)
   */
  updateVariant = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const bodyValidation = updateItemVariantBodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return Send.error(
          res,
          bodyValidation.error.issues,
          "Invalid request data.",
          400
        );
      }

      // 2. Get authenticated user ID
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "Authentication required.", 401);
      }

      // 3. Get item ID and variant ID from params
      const { itemId } = req.params;

      // 4. Update variant through business service
      const updatedVariant = await this.itemService.updateItemVariant(
        itemId,
        bodyValidation.data,
        userId
      );

      Logger.business("item_variant_updated", {
        requestId: (req as any).requestId,
        userId,
        itemId,
        updates: bodyValidation.data,
      });

      return Send.success(
        res,
        updatedVariant,
        "Item variant updated successfully."
      );
    } catch (error) {
      Logger.error("Error updating item variant", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        itemId: req.params.itemId,
        body: req.body,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update item variant.");
    }
  };
  /**
   * Partially update an existing item (JSON request)
   */
  partialUpdate = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body using a subset schema
      const partialUpdateSchema = updateItemBodySchema.partial();
      const bodyValidation = partialUpdateSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return Send.error(
          res,
          bodyValidation.error.issues,
          "Invalid request data.",
          400
        );
      }

      // 2. Get authenticated user ID
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "Authentication required.", 401);
      }

      // 3. Get item ID from params
      const { id } = req.params;

      // 4. Update item through business service (no file uploads for PATCH)
      const item = await this.itemService.updateItem(
        id,
        bodyValidation.data,
        userId
      );

      Logger.business("item_partially_updated", {
        requestId: (req as any).requestId,
        userId,
        itemId: id,
        updates: Object.keys(bodyValidation.data),
      });

      return Send.success(res, item, "Item updated successfully.");
    } catch (error) {
      Logger.error("Error partially updating item", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        itemId: req.params.id,
        body: req.body,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update item.");
    }
  };

  /**
   * Update auction item (price, dates, quantity)
   */
  updateVariantAuctionItem = async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const bodyValidation = updateVariantAuctionItemBodySchema.safeParse(
        req.body
      );
      if (!bodyValidation.success) {
        return Send.error(
          res,
          bodyValidation.error.issues,
          "Invalid request data.",
          400
        );
      }

      // 2. Get authenticated user ID
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "Authentication required.", 401);
      }

      // 3. Get item ID from params
      const { itemId } = req.params;

      // 4. Update auction item through business service
      const updatedItem = await this.itemService.updateVariantAuctionItem(
        itemId,
        bodyValidation.data,
        userId
      );

      Logger.business("auction_item_updated", {
        requestId: (req as any).requestId,
        userId,
        itemId: itemId,
        updates: Object.keys(bodyValidation.data),
      });

      return Send.success(
        res,
        updatedItem,
        "Auction item updated successfully."
      );
    } catch (error) {
      Logger.error("Error updating auction item", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        itemId: req.params.itemId,
        body: req.body,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update auction item.");
    }
  };

  /**
   * Get search suggestions
   */
  suggestions = async (req: Request, res: Response) => {
    try {
      // 1. Validate query parameters
      const validation = searchSuggestionsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters.",
          400
        );
      }

      const { query, limit } = validation.data;

      const suggestions = await this.itemService.getSearchSuggestions(
        query,
        limit
      );

      return Send.success(
        res,
        { suggestions },
        "Suggestions retrieved successfully."
      );
    } catch (error) {
      Logger.error("Error getting suggestions", error, {
        requestId: (req as any).requestId,
        userId: req.userId,
        query: req.query,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve suggestions.");
    }
  };
}

export default ItemController;
