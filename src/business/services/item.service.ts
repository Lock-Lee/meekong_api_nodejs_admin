import { injectable, inject } from "inversify";
import {
  IItemRepository,
  ITagService,
  IItemService,
  CreateItemRequest,
  CreateItemData,
  SearchItemsRequest,
  SearchFilters,
  ItemDetails,
  SearchResult,
  UpdateItemVariantRequest,
  UpdateVariantAuctionItemRequest,
  ItemVariant,
  ItemVariantUpdate,
} from "../interfaces/item.interfaces";
import { IInventoryService, CreateInventoryLogData } from "../interfaces/inventory.interfaces";
import { TYPES } from "../../shared/types/service.types";
import { IFileService, UploadResult } from "@business/interfaces/file.interfaces";
import { InventoryAction } from "../../../generated/prisma";
import {
  BusinessError,
  ItemNotOwnedError,
  MaxTagsExceededError,
  InvalidShippingDurationError,
  InvalidItemVariantError
} from "../../shared/errors/business.errors";
import { Logger } from "@utils/logger";

@injectable()
export class ItemService implements IItemService {
  constructor(
    @inject(TYPES.ItemRepository) private itemRepository: IItemRepository,
    @inject(TYPES.TagService) private tagService: ITagService,
    @inject(TYPES.FileService) private fileService: IFileService,
    @inject(TYPES.InventoryService) private inventoryService: IInventoryService
  ) { }

  /**
   * Create a new item with tags and images
   */
  async createItem(data: CreateItemRequest, userId: string): Promise<ItemDetails> {
    try {
      // 1. Validate business rules
      await this.validateCreateItem(data);

      // 2. Upload images if provided
      let uploadedImages: UploadResult[] = [];
      if (data.images && data.images.length > 0) {
        uploadedImages = await this.fileService.uploadItemImages(data.images);
      }

      // 3. Create the item
      const itemData: CreateItemData = {
        brandId: data.brandId,
        categoryId: data.categoryId,
        nameTh: data.nameTh,
        nameEn: data.nameEn,
        descriptionTh: data.descriptionTh,
        descriptionEn: data.descriptionEn,
        itemType: data.itemType,
        sellType: data.sellType,
        shippingDuration: data.shippingDuration,
        sellerId: userId,
        itemVariants: data.itemVariants,
        status: data.status,
      };

      const item = await this.itemRepository.create(itemData);

      // 4. Process tags if provided
      if (data.tags && data.tags.length > 0) {
        await this.tagService.processItemTags(item.id, data.tags);
      }

      // 5. Save images to database
      if (uploadedImages.length > 0) {
        await this.fileService.saveItemImages(item.id, uploadedImages, userId);
      }

      // 6. Log initial inventory for each variant
      if (item.itemVariants && item.itemVariants.length > 0) {
        for (const variant of item.itemVariants) {
          if (variant.stockQuantity > 0) {
            const inventoryLogData: CreateInventoryLogData = {
              itemId: item.id,
              variantId: variant.id,
              action: InventoryAction.ADD,
              quantity: variant.stockQuantity,
              balance: variant.stockQuantity,
              reason: "Initial stock on item creation",
              createdById: userId,
            };

            await this.inventoryService.logInventoryChange(inventoryLogData);
          }
        }
      }

      // 7. Return the complete item
      return this.getItemDetails(item.id, userId);
    } catch (error: any) {
      Logger.error("Failed to create item", error);

      // Preserve explicit business errors
      if (error instanceof BusinessError) {
        throw error;
      }

      // Handle Prisma foreign key constraint errors
      if (error?.code === 'P2003') {
        const constraint = error.meta?.constraint;
        if (constraint === 'Item_brandId_fkey') {
          throw new BusinessError("Invalid brand ID provided", "VALIDATION_ERROR");
        } else if (constraint === 'Item_categoryId_fkey') {
          throw new BusinessError("Invalid category ID provided", "VALIDATION_ERROR");
        } else if (constraint?.includes('sizeUnitId')) {
          throw new BusinessError("Invalid size unit ID provided", "VALIDATION_ERROR");
        }
        throw new BusinessError("Invalid reference ID provided", "VALIDATION_ERROR");
      }

      // Fallback generic error
      throw new BusinessError("Failed to create item", "INTERNAL_SERVER_ERROR");
    }
  }

  /**
   * Search items with filters
   */
  async searchItems(request: SearchItemsRequest): Promise<SearchResult> {
    const filters: SearchFilters = {
      keyword: request.keyword,
      categoryId: request.categoryId,
      brandId: request.brandId,
      minPrice: request.minPrice,
      maxPrice: request.maxPrice,
      itemType: request.itemType,
      sellType: request.sellType,
      userId: request.userId,
      page: request.page || 1,
      take: 10,
    };

    const result = await this.itemRepository.search(filters);

    return {
      items: result.items,
      pagination: {
        currentPage: filters.page,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / filters.take),
        hasNextPage: filters.page * filters.take < result.total,
        hasPrevPage: filters.page > 1,
      },
    };
  }

  /**
   * Get item details by ID
   */
  async getItemDetails(id: string, userId?: string): Promise<ItemDetails> {
    return this.itemRepository.findById(id, userId);
  }

  /**
   * Update an existing item
   */
  async updateItem(id: string, data: Partial<CreateItemRequest>, userId: string): Promise<ItemDetails> {
    try {
      // 1. Validate ownership (business rule)
      const existingItem = await this.itemRepository.findById(id);
      if (existingItem.seller.id !== userId) {
        throw new ItemNotOwnedError();
      }

      // 2. Validate business rules
      await this.validateUpdateItem(data);

      // 3. Upload images if provided
      let uploadedImages: UploadResult[] = [];
      if (data.images && data.images.length > 0) {
        uploadedImages = await this.fileService.uploadItemImages(data.images);
      }

      // 4. Update the item with variants
      const updateData: Partial<CreateItemData> = {
        brandId: data.brandId,
        categoryId: data.categoryId,
        nameTh: data.nameTh,
        nameEn: data.nameEn,
        descriptionTh: data.descriptionTh,
        descriptionEn: data.descriptionEn,
        itemType: data.itemType,
        sellType: data.sellType,
        shippingDuration: data.shippingDuration,
        itemVariants: data.itemVariants,
        status: data.status,
      };



      const updatedItem = await this.itemRepository.update(id, updateData);

      // 5. Update tags if provided (use differential update)
      if (data.tags !== undefined) {
        await this.tagService.updateItemTags(id, data.tags);
      }

      // 6. Save new images to database
      if (uploadedImages.length > 0) {
        await this.fileService.saveItemImages(id, uploadedImages, userId);
      }

      // 7. Log inventory changes for updated variants
      if (updatedItem.itemVariants && updatedItem.itemVariants.length > 0) {
        for (const variant of updatedItem.itemVariants) {
          // Get the previous stock level
          const currentStock = await this.inventoryService.getCurrentStock(variant.id);

          if (variant.stockQuantity !== currentStock) {
            const difference = variant.stockQuantity - currentStock;
            const action = difference > 0 ? InventoryAction.ADD : InventoryAction.REMOVE;
            const quantity = Math.abs(difference);

            if (difference !== 0) {
              const inventoryLogData: CreateInventoryLogData = {
                itemId: id,
                variantId: variant.id,
                action,
                quantity,
                balance: variant.stockQuantity,
                reason: "Stock updated via item update",
                createdById: userId,
              };

              await this.inventoryService.logInventoryChange(inventoryLogData);
            }
          }
        }
      }

      // 8. Return the complete updated item
      return this.getItemDetails(id, userId);
    } catch (error: any) {
      Logger.error("Failed to update item", error);

      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        const constraint = error.meta?.constraint;
        if (constraint === 'Item_brandId_fkey') {
          throw new BusinessError("Invalid brand ID provided", "VALIDATION_ERROR");
        } else if (constraint === 'Item_categoryId_fkey') {
          throw new BusinessError("Invalid category ID provided", "VALIDATION_ERROR");
        } else if (constraint?.includes('sizeUnitId')) {
          throw new BusinessError("Invalid size unit ID provided", "VALIDATION_ERROR");
        }
        throw new BusinessError("Invalid reference ID provided", "VALIDATION_ERROR");
      }

      throw new BusinessError("Failed to update item", "INTERNAL_SERVER_ERROR");
    }
  }

  /**
   * Update item variant (price and stock)
   */
  async updateItemVariant(
    itemId: string,
    data: UpdateItemVariantRequest,
    userId: string
  ): Promise<ItemVariantUpdate> {
    try {
      // 1. Validate business rules first

      // 2. Update the variant (repository will handle ownership validation)
      const updatedVariant = await this.itemRepository.updateVariant(
        itemId,
        data,
        userId
      );

      return updatedVariant;
    } catch (error: any) {
      Logger.error("Failed to update item variant", error);

      if (error instanceof BusinessError) {
        throw error;
      }

      throw new BusinessError("Failed to update item variant", "INTERNAL_SERVER_ERROR");
    }
  }

  /**
   * Update auction item (price, dates, quantity)
   */
  async updateVariantAuctionItem(
    id: string,
    data: UpdateVariantAuctionItemRequest,
    userId: string
  ): Promise<ItemVariantUpdate> {
    try {

      const updatedItem = await this.itemRepository.updateVariantAuctionItem(id, data, userId);

      return updatedItem;
    } catch (error: any) {
      Logger.error("Failed to update auction item", error);

      if (error instanceof BusinessError) {
        throw error;
      }

      throw new BusinessError("Failed to update auction item", "INTERNAL_SERVER_ERROR");
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(id: string, userId: string, status?: string): Promise<void> {
    // 1. Validate ownership
    const existingItem = await this.itemRepository.findById(id);
    if (existingItem.seller.id !== userId) {
      throw new ItemNotOwnedError();
    }

    // 2. Delete the item (soft delete)
    await this.itemRepository.delete(id, userId, status);

    // 3. Clean up associated files
    if (status === "DELETE") {
      await this.fileService.deleteItemImages(id);
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.itemRepository.getSearchSuggestions(query.trim(), limit);
  }

  /**
   * Business rule: Validate item creation
   */
  private async validateCreateItem(data: CreateItemRequest): Promise<void> {
    // Required fields validation
    if (!data.brandId || data.brandId.trim() === '') {
      throw new BusinessError("Brand ID is required");
    }

    if (!data.categoryId || data.categoryId.trim() === '') {
      throw new BusinessError("Category ID is required");
    }

    // Business rules
    if (data.tags && data.tags.length > 3) {
      throw new MaxTagsExceededError();
    }

    if (data.shippingDuration && (data.shippingDuration < 1 || data.shippingDuration > 30)) {
      throw new InvalidShippingDurationError();
    }
    // Per request: do not validate nameTh/nameEn/itemVariants at service level.
    // Allow creating items without variants or with variants that may be completed later.
  }

  /**
   * Business rule: Validate item update
   */
  private async validateUpdateItem(data: Partial<CreateItemRequest>): Promise<void> {
    // Required fields validation (only if provided)
    if (data.brandId !== undefined && (!data.brandId || data.brandId.trim() === '')) {
      throw new BusinessError("Brand ID cannot be empty");
    }

    if (data.categoryId !== undefined && (!data.categoryId || data.categoryId.trim() === '')) {
      throw new BusinessError("Category ID cannot be empty");
    }

    // Business rules
    if (data.tags && data.tags.length > 3) {
      throw new MaxTagsExceededError();
    }

    if (data.shippingDuration && (data.shippingDuration < 1 || data.shippingDuration > 30)) {
      throw new InvalidShippingDurationError();
    }


  }

}
