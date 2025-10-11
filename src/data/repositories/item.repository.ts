import { injectable } from "inversify";
import { prisma } from "../database/db";
import { ImageType, Status, AuctionParticipantStatus, SellType } from "../../../generated/prisma";
import {
  IItemRepository,
  CreateItemData,
  SearchFilters,
  ItemDetails,
  UpdateItemVariantRequest,
  UpdateVariantAuctionItemRequest,
  ItemVariantUpdate,
} from "../../business/interfaces/item.interfaces";
import { IFileService } from "@business/interfaces/file.interfaces";
import { inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";

@injectable()
export class ItemRepository implements IItemRepository {
  /**
   * Create a new item with generated code and variants
   */
  constructor(@inject(TYPES.FileService) private fileService: IFileService) {}
  async create(data: CreateItemData): Promise<ItemDetails> {
    const itemCode = `ITEM-${Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()}`;

    // Use transaction to ensure data consistency
    const item = await prisma.$transaction(async (tx) => {
      // 1. Create the item
      const createdItem = await tx.item.create({
        data: {
          code: itemCode,
          nameTh: data.nameTh || "",
          nameEn: data.nameEn || "",
          descriptionTh: data.descriptionTh,
          descriptionEn: data.descriptionEn,
          itemType: data.itemType,
          sellType: data.sellType,
          shippingDuration: data.shippingDuration,
          status: data.status || Status.ACTIVE,
          sellerId: data.sellerId,
          brandId: data.brandId,
          categoryId: data.categoryId,
        },
      });

      // 2. Create item variants if provided
      if (data.itemVariants && data.itemVariants.length > 0) {
        for (const variantData of data.itemVariants) {
          // Auto-generate SKU if not provided (match existing format: SKU-{randomString})
          const sku =
            variantData.sku ||
            `SKU-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

          const variant = await tx.itemVariant.create({
            data: {
              itemId: createdItem.id,
              sku: sku,
              color: variantData.color,
              conditionDescription: variantData.conditionDescription,
              defectNotes: variantData.defectNotes,
              includedItems: variantData.includedItems,
              price: variantData.price,
              stock: variantData.stockQuantity,
              weight: variantData.weight,
              dimensionWidth: variantData.dimensionWidth,
              dimensionHigh: variantData.dimensionHigh,
              dimensionLong: variantData.dimensionLong,
            },
          });

          // Only upload when images are provided; support single file or array
          if (variantData.images) {
            const imagesArray = Array.isArray(variantData.images)
              ? variantData.images
              : [variantData.images];

            if (imagesArray.length > 0) {
              const uploadedImages = await this.fileService.uploadItemImages(
                imagesArray
              );
              // Persist uploaded images linked to the created variant
              const images = await tx.image.createMany({
                data: uploadedImages.map((image, index) => ({
                  imageUrl: image.url,
                  altText: `variant image ${index}`,
                  isPrimary: index === 0,
                  type: ImageType.VARIANT,
                  targetId: variant.id,
                  createdById: data.sellerId,
                })),
              });

              const imagesResult = await tx.image.findMany({
                where: { targetId: variant.id, type: ImageType.VARIANT },
              });
            }
          }

          // 3. Create variant sizes if provided
          if (variantData.sizes && variantData.sizes.length > 0) {
            for (const sizeData of variantData.sizes) {
              await tx.itemVariantSize.create({
                data: {
                  variantId: variant.id,
                  sizeUnitId: sizeData.sizeUnitId,
                  value: sizeData.value,
                  sortOrder: sizeData.sortOrder,
                },
              });
            }
          }
        }
      }

      // 4. Return the complete item with relations
      return await tx.item.findUnique({
        where: { id: createdItem.id },
        include: {
          seller: {
            include: { profile: true },
          },
          category: true,
          brand: true,
          itemVariants: {
            include: {
              sizes: {
                include: {
                  sizeUnit: true,
                },
              },
            },
          },
          images: {
            include: {
              image: true,
            },
          },
        },
      });
    });

    return this.mapToItemDetails(item);
  }

  /**
   * Find item by ID with all relations
   */
  async findById(id: string, userId?: string): Promise<any> {
    const item = await prisma.item.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        nameTh: true,
        nameEn: true,
        itemType: true,
        sellType: true,
        descriptionTh: true,
        descriptionEn: true,
        brand: {
          select: { id: true, nameTh: true, nameEn: true },
        },
        itemVariants: {
          select: {
            id: true,
            price: true,
            color: true,
            stock: true,
            conditionDescription: true,
            defectNotes: true,
            includedItems: true,
            weight: true,
            dimensionWidth: true,
            dimensionHigh: true,
            dimensionLong: true,
            sizes: {
              select: {
                value: true,
                sizeUnit: { select: { name: true } },
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            Shop: {
              select: {
                id: true,
                name: true,
              },
            },
            profile: {
              select: {
                avatarUrl: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        auction: {
          include: {
            bids: userId ? { where: { userId } } : false,
            _count: {
              select: {
                bids: true,
              },
            },
            AuctionParticipant: {
              where:
                userId && userId !== ""
                  ? { userId: userId }
                  : { id: { in: [] } },
            },
          },
        },
      },
    });

    // Fetch and add tags to the item
    const tags = await this.fetchItemTags(item.id);
    const images = await prisma.image.findMany({
      where: {
        targetId: item.id,
        type: ImageType.ITEM,
      },
      select: {
        id: true,
        targetId: true,
        imageUrl: true,
        isPrimary: true,
      },
      orderBy: { isPrimary: "desc" },
    });

    // Build variants with images (ImageType.VARIANT)
    const validVariants = await this.getVariantsWithImages(
      item.itemVariants as any[]
    );

    const hasUserBid = userId && item.auction && item.auction.bids.length > 0;
    const { ...auctionWithoutBids } = item.auction || {};

    return {
      ...item,
      auction: item.auction
        ? {
            ...auctionWithoutBids,
            hasUserBid,
            AuctionParticipant: item.auction.AuctionParticipant || [],
          }
        : { AuctionParticipant: [] },
      imageList: images || [],
      tags,
      itemVariants: validVariants,
    };
  }

  /**
   * Search items with filters and pagination
   */
  async search(
    filters: SearchFilters
  ): Promise<{ items: any[]; total: number }> {
    const {
      keyword,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      itemType,
      sellType,
      userId,
      page,
      take,
    } = filters;
    const skip = (page - 1) * take;

    console.log("xxxx" + userId);

    // Build where clause
    const where: any = {
      status: Status.ACTIVE,
    };

    if (sellType && sellType.length > 0) {
      where.sellType = { in: sellType };
    }
    if (categoryId && categoryId.length > 0) {
      where.categoryId = { in: categoryId };
    }
    if (brandId && brandId.length > 0) {
      where.brandId = { in: brandId };
    }
    if (itemType) {
      where.itemType = itemType;
    }

    if (keyword) {
      where.OR = [
        { nameTh: { contains: keyword, mode: "insensitive" } },
        { nameEn: { contains: keyword, mode: "insensitive" } },
        { descriptionTh: { contains: keyword, mode: "insensitive" } },
        { descriptionEn: { contains: keyword, mode: "insensitive" } },
        { brand: { nameTh: { contains: keyword, mode: "insensitive" } } },
        { brand: { nameEn: { contains: keyword, mode: "insensitive" } } },
        { category: { nameTh: { contains: keyword, mode: "insensitive" } } },
        { category: { nameEn: { contains: keyword, mode: "insensitive" } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.itemVariants = {
        some: {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        },
      };
    }

    // Execute query with transaction for count
    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nameTh: true,
          nameEn: true,
          itemType: true,
          sellType: true,
          descriptionTh: true,
          descriptionEn: true,
          brand: {
            select: { id: true, nameTh: true, nameEn: true },
          },
          itemVariants: {
            select: {
              id: true,
              price: true,
              color: true,
              stock: true,
              conditionDescription: true,
              defectNotes: true,
              includedItems: true,
              weight: true,
              dimensionWidth: true,
              dimensionHigh: true,
              dimensionLong: true,
              sizes: {
                select: {
                  value: true,
                  sizeUnit: { select: { name: true } },
                },
              },
            },
          },
          seller: {
            select: {
              id: true,
              Shop: {
                select: {
                  id: true,
                  name: true,
                },
              },
              profile: {
                select: {
                  avatarUrl: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          auction: {
            include: {
              bids: userId ? { where: { userId } } : false,
              _count: {
                select: {
                  bids: true,
                },
              },
              AuctionParticipant: {
                where:
                  userId && userId !== ""
                    ? { userId: userId }
                    : { id: { in: [] } },
              },
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    const itemIds = items.map((item) => item.id);
    const images = await prisma.image.findMany({
      where: {
        targetId: { in: itemIds },
        type: ImageType.ITEM,
      },
      select: {
        id: true,
        targetId: true,
        imageUrl: true,
        isPrimary: true,
      },
      orderBy: { isPrimary: "desc" },
    });

    const imagesByItemId = images.reduce((acc, image) => {
      const key = image.targetId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(image);
      return acc;
    }, {} as Record<string, typeof images>);

    const itemsWithImages = await Promise.all(
      items.map(async (item) => {
        const hasUserBid =
          userId && item.auction && item.auction.bids.length > 0;
        const { ...auctionWithoutBids } = item.auction || {};
        const tags = await this.fetchItemTags(item.id);

        const validVariants = await this.getVariantsWithImages(
          item.itemVariants
        );

        return {
          ...item,
          auction: item.auction
            ? {
                ...auctionWithoutBids,
                hasUserBid,
                AuctionParticipant: item.auction.AuctionParticipant || [],
              }
            : { AuctionParticipant: [] },
          imageList: imagesByItemId[item.id] || [],
          tags,
          itemVariants: validVariants,
        };
      })
    );

    return { items: itemsWithImages, total };
  }

  /**
   * Update item by ID with variants
   */
  async update(
    id: string,
    data: Partial<CreateItemData>
  ): Promise<ItemDetails> {
    // Use transaction to ensure data consistency
    const item = await prisma.$transaction(async (tx) => {
      // 1. Update the item basic fields
      const updateData: any = { ...data };
      // Remove fields that shouldn't be in Prisma update
      delete updateData.sellerId; // For creation only
      delete updateData.itemVariants; // Handle separately
      delete updateData.tags; // Handled by TagService
      delete updateData.images; // Handled by FileService

      await tx.item.update({
        where: { id },
        data: updateData,
      });

      // 2. Handle item variants if provided
      if (data.itemVariants && data.itemVariants.length > 0) {
        // Get existing variants to preserve inventory logs
        const existingVariants = await tx.itemVariant.findMany({
          where: { itemId: id },
          include: {
            sizes: true,
            inventoryLogs: true,
          },
        });

        // Delete existing variant sizes (they don't have foreign key constraints)
        await tx.itemVariantSize.deleteMany({
          where: {
            variant: {
              itemId: id,
            },
          },
        });

        // Update or create variants (preserve existing ones to keep inventory logs)
        for (let i = 0; i < data.itemVariants.length; i++) {
          const variantData = data.itemVariants[i];
          let variant;

          if (i < existingVariants.length) {
            // Update existing variant
            // Auto-generate SKU if not provided (keep existing if new one is not provided)
            const sku =
              variantData.sku ||
              existingVariants[i].sku ||
              `SKU-${Math.random()
                .toString(36)
                .substring(2, 12)
                .toUpperCase()}`;

            variant = await tx.itemVariant.update({
              where: { id: existingVariants[i].id },
              data: {
                sku: sku,
                color: variantData.color,
                conditionDescription: variantData.conditionDescription,
                defectNotes: variantData.defectNotes,
                includedItems: variantData.includedItems,
                price: variantData.price,
                stock: variantData.stockQuantity,
                weight: variantData.weight,
                dimensionWidth: variantData.dimensionWidth,
                dimensionHigh: variantData.dimensionHigh,
                dimensionLong: variantData.dimensionLong,
              },
            });
          } else {
            // Create new variant
            // Auto-generate SKU if not provided (match existing format: SKU-{randomString})
            const sku =
              variantData.sku ||
              `SKU-${Math.random()
                .toString(36)
                .substring(2, 12)
                .toUpperCase()}`;

            variant = await tx.itemVariant.create({
              data: {
                itemId: id,
                sku: sku,
                color: variantData.color,
                conditionDescription: variantData.conditionDescription,
                defectNotes: variantData.defectNotes,
                includedItems: variantData.includedItems,
                price: variantData.price,
                stock: variantData.stockQuantity,
                weight: variantData.weight,
                dimensionWidth: variantData.dimensionWidth,
                dimensionHigh: variantData.dimensionHigh,
                dimensionLong: variantData.dimensionLong,
              },
            });
          }

          // Create variant sizes if provided
          if (variantData.sizes && variantData.sizes.length > 0) {
            for (const sizeData of variantData.sizes) {
              await tx.itemVariantSize.create({
                data: {
                  variantId: variant.id,
                  sizeUnitId: sizeData.sizeUnitId,
                  value: sizeData.value,
                  sortOrder: sizeData.sortOrder,
                },
              });
            }
          }
        }

        // Delete excess variants if new list is shorter (but preserve inventory logs)
        if (data.itemVariants.length < existingVariants.length) {
          const variantsToDelete = existingVariants.slice(
            data.itemVariants.length
          );
          for (const variant of variantsToDelete) {
            // Only delete if no inventory logs exist
            const hasInventoryLogs =
              variant.inventoryLogs && variant.inventoryLogs.length > 0;
            if (!hasInventoryLogs) {
              await tx.itemVariant.delete({
                where: { id: variant.id },
              });
            } else {
              // Mark as inactive or set stock to 0 instead of deleting
              await tx.itemVariant.update({
                where: { id: variant.id },
                data: { stock: 0 },
              });
            }
          }
        }
      }

      // 3. Return the complete updated item with relations
      return await tx.item.findUnique({
        where: { id },
        include: {
          seller: {
            include: { profile: true },
          },
          category: true,
          brand: true,
          itemVariants: {
            include: {
              sizes: {
                include: {
                  sizeUnit: true,
                },
              },
            },
          },
          images: {
            include: {
              image: true,
            },
          },
        },
      });
    });

    return this.mapToItemDetails(item);
  }

  /**
   * Update item variant (price and stock only)
   */
  async updateVariant(
    itemId: string,
    data: UpdateItemVariantRequest,
    userId: string
  ): Promise<ItemVariantUpdate> {
    // Find the variant with its associated item to validate ownership

    const updateItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        nameTh: data.nameTh,
        nameEn: data.nameEn,
        updatedAt: new Date(),
      },
    });

    if (!data.itemVariants) {
      return this.mapToItemVariant(null, {
        nameTh: updateItem.nameTh,
        nameEn: updateItem.nameEn,
      });
    }

    // Update each provided variant; track the last updated one to return
    let lastUpdatedVariant: any = null;
    for (const itemVariant of data.itemVariants) {
      lastUpdatedVariant = await prisma.itemVariant.update({
        where: { id: itemVariant.variantId, itemId: itemId },
        data: {
          price: itemVariant.price,
          stock: itemVariant.stockQuantity,
        },
      });
    }

    // Map to ItemVariantUpdate interface using the original variant data for seller info
    return this.mapToItemVariant(lastUpdatedVariant, {
      nameTh: updateItem.nameTh,
      nameEn: updateItem.nameEn,
    });
  }

  private mapToItemVariant(
    updatedVariant: any,
    itemNames?: { nameTh?: string; nameEn?: string }
  ): ItemVariantUpdate {
    return {
      itemId: updatedVariant.itemId,
      userId: updatedVariant.sellerId,
      nameTh: itemNames?.nameTh,
      nameEn: itemNames?.nameEn,
      itemVariants: [
        {
          variantId: updatedVariant.id,
          price: updatedVariant.price,
          stockQuantity: updatedVariant.stock,
        },
      ],
    };
  }

  /**
   * Update auction item
   */
  async updateVariantAuctionItem(
    itemId: string,
    data: UpdateVariantAuctionItemRequest,
    userId: string
  ): Promise<ItemVariantUpdate> {
    // Update item basic fields first

    const updateItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(data.nameTh !== undefined ? { nameTh: data.nameTh } : {}),
        ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
        updatedAt: new Date(),
      },
    });

    // Update variants' stock if provided (constrained by itemId for safety)
    if (data.itemVariants && data.itemVariants.length > 0) {
      for (const v of data.itemVariants) {
        await prisma.itemVariant.update({
          where: { id: v.variantId, itemId },
          data: {
            ...(v.stockQuantity !== undefined
              ? { stock: v.stockQuantity }
              : {}),
          },
        });
      }
    }

    // Update auction fields if provided (ensure the auction belongs to the item)
    if (data.itemAuction && data.itemAuction.length > 0) {
      for (const a of data.itemAuction) {
        let findAuction = await prisma.auction.findFirst({
          where: { itemId, id: a.auctionId },
        });

        if (!findAuction) {
          throw new Error(
            `Auction not found for item or does not belong to item (auctionId=${a.auctionId}, itemId=${itemId})`
          );
        }

        const result = await prisma.auction.updateMany({
          where: { id: a.auctionId, itemId },
          data: {
            ...(a.startPrice !== undefined ? { startPrice: a.startPrice } : {}),
            ...(a.buyNowPrice !== undefined
              ? { buyNowPrice: a.buyNowPrice }
              : {}),
            ...(a.startAt !== undefined
              ? { startAt: new Date(a.startAt) }
              : {}),
            ...(a.endAt !== undefined ? { endAt: new Date(a.endAt) } : {}),
          },
        });
        if (result.count === 0) {
          throw new Error(
            `Auction not found for item or does not belong to item (auctionId=${a.auctionId}, itemId=${itemId})`
          );
        }
      }
    }

    // Build response summary without relying on undefined variables
    return {
      itemId,
      userId,
      nameTh: data.nameTh,
      nameEn: data.nameEn,
      itemVariants: data.itemVariants,
      itemAuction: data.itemAuction,
    };
  }

  /**
   * Delete item (soft delete by updating status)
   * - INACTIVE: Clear Bid, Satisfy tables and update AuctionParticipant.refundedAt
   */
  async delete(id: string, userId: string, status?: string): Promise<void> {
    const statusMap: Record<"DELETED" | "INACTIVE" | "ACTIVE", Status> = {
      DELETED: Status.DELETED,
      INACTIVE: Status.INACTIVE,
      ACTIVE: Status.ACTIVE,
    };
    // Validate and narrow status before indexing the map to satisfy TS
    if (
      !status ||
      !(status === "DELETED" || status === "INACTIVE" || status === "ACTIVE")
    ) {
      throw new Error(
        `Invalid status '${status}'. Allowed: DELETED, INACTIVE, ACTIVE`
      );
    }
    const statusUpdate = statusMap[status];

    // ถ้าเป็น INACTIVE ให้ทำการ clear ข้อมูลที่เกี่ยวข้อง
    if (status === "INACTIVE") {
      await prisma.$transaction(async (tx) => {
        // 1. ดึงข้อมูล item เพื่อเช็ค sellType
        const item = await tx.item.findUnique({
          where: { id },
          select: { 
            id: true, 
            sellType: true,
            auction: { select: { id: true } }
          },
        });

        if (!item) {
          throw new Error("Item not found");
        }

        // 2. ถ้าเป็นสินค้าประมูล (sellType = AUCTION)
        if (item.sellType === SellType.AUCTION && item.auction) {
          const auctionId = item.auction.id;
          const now = new Date();

          // Clear ตาราง Bid
          await tx.bid.deleteMany({
            where: { auctionId },
          });

          // Update AuctionParticipant.refundedAt สำหรับผู้ที่จ่ายมัดจำแล้ว
          await tx.auctionParticipant.updateMany({
            where: {
              auctionId,
              status: AuctionParticipantStatus.PAID,
              refundedAt: null,
            },
            data: {
              refundedAt: now,
              status: AuctionParticipantStatus.REFUNDED,
            },
          });
        }

        // 3. ถ้าเป็นสินค้าต่อรอง (sellType = SATISFY) - Clear ตาราง Satisfy
        if (item.sellType === SellType.SATISFY) {
          await tx.satisfy.deleteMany({
            where: { itemId: id },
          });
        }

        // 4. Update สถานะ item เป็น INACTIVE
        await tx.item.update({
          where: { id },
          data: { status: statusUpdate },
        });
      });
    } else {
      // ถ้าไม่ใช่ INACTIVE ให้ update สถานะตามปกติ
      await prisma.item.update({
        where: { id },
        data: { status: statusUpdate },
      });
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    const items = await prisma.item.findMany({
      where: {
        status: Status.ACTIVE,
        OR: [
          { nameTh: { contains: query, mode: "insensitive" } },
          { nameEn: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        nameTh: true,
        nameEn: true,
      },
      take: limit,
    });

    const suggestions = new Set<string>();
    items.forEach((item) => {
      if (item.nameTh.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.nameTh);
      }
      if (item.nameEn.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.nameEn);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Fetch tags for a specific item
   */
  private async fetchItemTags(itemId: string): Promise<string[]> {
    const tagLinks = await prisma.tagLink.findMany({
      where: {
        targetType: "ITEM",
        targetId: itemId,
      },
      include: {
        tag: {
          select: {
            name: true,
          },
        },
      },
    });

    return tagLinks.map((link) => link.tag.name);
  }

  /**
   * Map Prisma item to ItemDetails interface
   */
  private mapToItemDetails(item: any): ItemDetails {
    return {
      id: item.id,
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      descriptionTh: item.descriptionTh,
      descriptionEn: item.descriptionEn,
      itemType: item.itemType,
      sellType: item.sellType,
      shippingDuration: item.shippingDuration,
      status: item.status,
      seller: {
        id: item.seller.id,
        email: item.seller.email,
        profile: item.seller.profile
          ? {
              firstName: item.seller.profile.firstName,
              lastName: item.seller.profile.lastName,
            }
          : undefined,
      },
      category: {
        id: item.category.id,
        nameTh: item.category.nameTh,
        nameEn: item.category.nameEn,
      },
      brand: {
        id: item.brand.id,
        name: item.brand.name,
      },
      itemVariants:
        item.itemVariants?.map((variant: any) => ({
          id: variant.id,
          variantName: variant.variantName || variant.color || "Default",
          price: Number(variant.price),
          comparePrice: variant.comparePrice
            ? Number(variant.comparePrice)
            : undefined,
          stockQuantity: variant.stock,
          sku: variant.sku,
          color: variant.color,
          conditionDescription: variant.conditionDescription,
          defectNotes: variant.defectNotes,
          includedItems: variant.includedItems,
          weight: variant.weight,
          dimensionWidth: variant.dimensionWidth,
          dimensionHigh: variant.dimensionHigh,
          dimensionLong: variant.dimensionLong,
          sizes:
            variant.sizes?.map((size: any) => ({
              id: size.id,
              sizeUnitId: size.sizeUnitId,
              value: size.value,
              sortOrder: size.sortOrder,
              sizeUnit: {
                id: size.sizeUnit.id,
                name: size.sizeUnit.name,
                unitSymbol: size.sizeUnit.unitSymbol,
              },
            })) || [],
        })) || [],
      images:
        item.images?.map((image: any) => ({
          id: image.id,
          url: image.url,
          altText: image.altText,
          isPrimary: image.isPrimary || false,
        })) || [],
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async getVariantsWithImages(itemVariants: any[]) {
    // Collect variant ids
    const variantIds = (itemVariants || [])
      .map((v: any) => v.id)
      .filter(Boolean);
    if (variantIds.length === 0) return [];

    // Fetch variant data in batch
    const variantsData = await prisma.itemVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        sizes: {
          select: {
            id: true,
            value: true,
            variantId: true,
            sizeUnitId: true,
            sortOrder: true,
            sizeUnit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Fetch variant images (ImageType.VARIANT) in batch
    const variantImages = await prisma.image.findMany({
      where: {
        targetId: { in: variantIds },
        type: ImageType.VARIANT,
      },
      select: {
        id: true,
        targetId: true,
        imageUrl: true,
        isPrimary: true,
      },
      orderBy: { isPrimary: "desc" },
    });

    const imagesByVariantId = variantImages.reduce(
      (acc: Record<string, any[]>, img) => {
        const key = img.targetId as unknown as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(img);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Merge
    return variantsData.map((v) => ({
      ...v,
      images: imagesByVariantId[v.id] || [],
    }));
  }
}
