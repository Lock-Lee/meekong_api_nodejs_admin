import { injectable } from "inversify";
import {
  ICartService,
  CartListRequest,
  ManageCartItemRequest,
} from "../interfaces/cart.interfaces";
import { ImageType, SellType } from "../../../generated/prisma";
import { prisma } from "../../data/database/db";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class CartService implements ICartService {
  /**
   * Get user's cart items
   */
  async getCartItems(userId: string, request: CartListRequest): Promise<any> {
    try {
      const pageSize = 10;
      const skip = (request.page - 1) * pageSize;
      const take = 10;
      const where: any = {
        userId,
        item: {
          status: "ACTIVE",
        },
      };

      // Filter by sell types if provided
      if (request.sellType && request.sellType.length > 0) {
        where.item.sellType = { in: request.sellType };
      }

      // const [cartItems, total] = await prisma.$transaction([
      //   prisma.cartItem.findMany({
      //     where,
      //     take: pageSize,
      //     skip,
      //     orderBy: { createdAt: "desc" },
      //     include: {
      //       item: {
      //         include: {
      //           brand: { select: { id: true, nameTh: true, nameEn: true } },
      //           category: { select: { id: true, nameTh: true, nameEn: true } },
      //           images: {
      //             where: { mediaType: "IMAGE" },
      //             select: { imageUrl: true },
      //             orderBy: { order: "asc" },
      //             take: 1,
      //           },
      //           seller: {
      //             select: {
      //               id: true,
      //               profile: {
      //                 select: {
      //                   firstName: true,
      //                   lastName: true,
      //                   avatarUrl: true,
      //                 },
      //               },
      //             },
      //           },
      //         },
      //       },
      //       variant: {
      //         include: {
      //           sizes: {
      //             include: {
      //               sizeUnit: { select: { name: true } },
      //             },
      //           },
      //         },
      //       },
      //     },
      //   }),
      //   prisma.cartItem.count({ where }),
      // ]);

      // const totalPages = Math.ceil(total / pageSize);

      const allCartItems = await prisma.cartItem.findMany({
        where: where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          item: {
            include: {
              itemVariants: {
                include: {
                  sizes: true,
                },
              },
              brand: {
                select: {
                  nameTh: true,
                  nameEn: true,
                },
              },
              seller: {
                include: {
                  profile: {
                    select: {
                      id: true, // Include seller ID for grouping
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Fetch additional images for the retrieved items
      const itemIds = allCartItems.map((cartItem) => cartItem.item.id);
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

      const cartItemsWithImages = allCartItems.map((cartItem) => {
        return {
          ...cartItem,
          item: {
            ...cartItem.item,
            imageList: imagesByItemId[cartItem.item.id] || [],
          },
        };
      });

      // Group cart items by seller
      const groupedCartItems = cartItemsWithImages.reduce(
        (acc: any, cartItem) => {
          const sellerId = cartItem.item.seller.profile?.id;
          if (sellerId) {
            if (!acc[sellerId]) {
              acc[sellerId] = {
                seller: {
                  id: sellerId,
                  firstName: cartItem.item.seller.profile?.firstName,
                  lastName: cartItem.item.seller.profile?.lastName,
                  avatarUrl: cartItem.item.seller.profile?.avatarUrl,
                  isChecked: false, // Add isChecked field to seller
                },
                items: [],
              };
            }
            // Add isChecked to each item
            acc[sellerId].items.push({ ...cartItem, isChecked: false });
          }
          return acc;
        },
        {}
      );

      const paginatedGroupedItems = Object.values(groupedCartItems).slice(
        skip,
        skip + take
      );
      const totalGroups = Object.keys(groupedCartItems).length;

      if (paginatedGroupedItems.length === 0) {
        return {
          cartItemsBySeller: [],
          pagination: {
            total: totalGroups,
            // page,
            pageSize: take,
            totalPages: Math.ceil(totalGroups / take),
          },
        };
      }

      // return {
      //   items: cartItems,
      //   pagination: {
      //     currentPage: request.page,
      //     totalPages,
      //     totalItems: total,
      //     hasNextPage: request.page < totalPages,
      //     hasPrevPage: request.page > 1,
      //   },
      // };

      return {
        cartItemsBySeller: paginatedGroupedItems,
        pagination: {
          total: totalGroups,
          // page,
          pageSize: take,
          totalPages: Math.ceil(totalGroups / take),
        },
      };
    } catch (error) {
      Logger.error("Error getting cart items", error, { userId, request });
      throw new BusinessError(
        "Failed to retrieve cart items",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  /**
   * Get satisfy items (items with SATISFY sell type)
   */
  async getSatisfyItems(page: number, pageSize: number): Promise<any> {
    try {
      // const skip = (page - 1) * pageSize;

      // const { page = 1, pageSize = 10 } = req.query;
      const pageNumber = Number(page);
      const pageSizeNumber = Number(pageSize);

      const satisfies = await prisma.satisfy.findMany({
        distinct: ["itemId"],
        orderBy: {
          createdAt: "desc",
        },
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          item: {
            include: {
              itemVariants: {
                include: {
                  sizes: true,
                },
              },
              brand: true,
              seller: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      });

      const itemIds = satisfies.map((satisfy) => satisfy.item.id);
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

      const satisfiesWithImages = satisfies.map((satisfy) => {
        return {
          ...satisfy,
          item: {
            ...satisfy.item,
            imageList: imagesByItemId[satisfy.item.id] || [],
          },
        };
      });

      const total = (await prisma.satisfy.groupBy({ by: ["itemId"] })).length;

      return {
        data: satisfiesWithImages,
        pagination: {
          page: pageNumber,
          pageSize: pageSizeNumber,
          total,
        },
      };

      // const [items, total] = await prisma.$transaction([
      //   prisma.item.findMany({
      //     where: {
      //       sellType: SellType.SATISFY,
      //       status: "ACTIVE",
      //     },
      //     take: pageSize,
      //     skip,
      //     orderBy: { createdAt: "desc" },
      //     include: {
      //       brand: { select: { id: true, nameTh: true, nameEn: true } },
      //       category: { select: { id: true, nameTh: true, nameEn: true } },
      //       images: {
      //         where: { mediaType: "IMAGE" },
      //         select: { imageUrl: true },
      //         orderBy: { order: "asc" },
      //         take: 1,
      //       },
      //       itemVariants: {
      //         select: {
      //           id: true,
      //           price: true,
      //           color: true,
      //           stock: true,
      //         },
      //       },
      //       seller: {
      //         select: {
      //           id: true,
      //           profile: {
      //             select: {
      //               firstName: true,
      //               lastName: true,
      //               avatarUrl: true,
      //             },
      //           },
      //         },
      //       },
      //       satisfy: {
      //         select: {
      //           id: true,
      //           agreedPrice: true,
      //           status: true,
      //         },
      //       },
      //     },
      //   }),
      //   prisma.item.count({
      //     where: {
      //       sellType: SellType.SATISFY,
      //       status: "ACTIVE",
      //     },
      //   }),
      // ]);

      // const totalPages = Math.ceil(total / pageSize);

      // return {
      //   items,
      //   pagination: {
      //     currentPage: page,
      //     totalPages,
      //     totalItems: total,
      //     hasNextPage: page < totalPages,
      //     hasPrevPage: page > 1,
      //   },
      // };
    } catch (error) {
      Logger.error("Error getting satisfy items", error, { page, pageSize });
      throw new BusinessError(
        "Failed to retrieve satisfy items",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  /**
   * Get auction items (items with AUCTION sell type)
   */
  async getAuctionItems(
    page: number,
    pageSize: number,
    userId: string
  ): Promise<any> {
    try {
      // const skip = (page - 1) * pageSize;

      // const { page = 1, pageSize = 10 } = req.query;
      const pageNumber = Number(page);
      const pageSizeNumber = Number(pageSize);

      const auctions = await prisma.auction.findMany({
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          item: {
            include: {
              itemVariants: {
                include: {
                  sizes: true,
                },
              },
              brand: true,
              seller: {
                include: {
                  profile: true,
                },
              },
            },
          },
          bids: {
            orderBy: {
              bidAt: "asc", // Order by ascending to easily check the first bid
            },
            select: {
              userId: true,
            },
          },
        },
      });

      const itemIds = auctions.map((auction) => auction.item.id);
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

      const auctionsWithDetails = auctions.map((auction) => {
        // Determine if the current user's bid is the first bid
        let isFirstBid = false;
        if (userId && auction.bids.length > 0) {
          const firstBid = auction.bids[0];
          if (firstBid.userId === userId) {
            isFirstBid = true;
          } else {
            isFirstBid = false;
          }
        }

        // Remove bids from the final output if not needed, or keep if useful
        const { ...auctionWithoutBids } = auction;

        return {
          ...auctionWithoutBids,
          item: {
            ...auction.item,
            imageList: imagesByItemId[auction.item.id] || [],
          },
          isFirstBid, // Include the new flag
        };
      });

      return {
        data: auctionsWithDetails,
        pagination: {
          page: pageNumber,
          pageSize: pageSizeNumber,
          total: await prisma.auction.count(),
        },
      };

      // const [items, total] = await prisma.$transaction([
      //   prisma.item.findMany({
      //     where: {
      //       sellType: SellType.AUCTION,
      //       status: "ACTIVE",
      //       auction: {
      //         isNot: null,
      //       },
      //     },
      //     take: pageSize,
      //     skip,
      //     orderBy: { createdAt: "desc" },
      //     include: {
      //       brand: { select: { id: true, nameTh: true, nameEn: true } },
      //       category: { select: { id: true, nameTh: true, nameEn: true } },
      //       images: {
      //         where: { mediaType: "IMAGE" },
      //         select: { imageUrl: true },
      //         orderBy: { order: "asc" },
      //         take: 1,
      //       },
      //       itemVariants: {
      //         select: {
      //           id: true,
      //           price: true,
      //           color: true,
      //           stock: true,
      //         },
      //       },
      //       seller: {
      //         select: {
      //           id: true,
      //           profile: {
      //             select: {
      //               firstName: true,
      //               lastName: true,
      //               avatarUrl: true,
      //             },
      //           },
      //         },
      //       },
      //       auction: {
      //         select: {
      //           id: true,
      //           startPrice: true,
      //           currentBid: true,
      //           startAt: true,
      //           endAt: true,
      //           isActive: true,
      //           bids: userId
      //             ? {
      //                 where: { userId },
      //                 select: { id: true, amount: true },
      //                 orderBy: { amount: "desc" },
      //                 take: 1,
      //               }
      //             : false,
      //         },
      //       },
      //     },
      //   }),
      //   prisma.item.count({
      //     where: {
      //       sellType: SellType.AUCTION,
      //       status: "ACTIVE",
      //       auction: {
      //         isNot: null,
      //       },
      //     },
      //   }),
      // ]);

      // const totalPages = Math.ceil(total / pageSize);

      // return {
      //   items,
      //   pagination: {
      //     currentPage: page,
      //     totalPages,
      //     totalItems: total,
      //     hasNextPage: page < totalPages,
      //     hasPrevPage: page > 1,
      //   },
      // };
    } catch (error) {
      Logger.error("Error getting auction items", error, {
        page,
        pageSize,
        userId,
      });
      throw new BusinessError(
        "Failed to retrieve auction items",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  /**
   * Manage cart item (add, update quantity, or remove)
   */
  async manageCartItem(
    userId: string,
    request: ManageCartItemRequest
  ): Promise<string> {
    try {
      const { itemId, variantId, quantity } = request;

      // Validate item and variant exist
      const variant = await prisma.itemVariant.findFirst({
        where: {
          id: variantId,
          itemId,
          item: {
            status: "ACTIVE",
            sellType: SellType.NORMAL, // Only normal items can be added to cart
          },
        },
        include: {
          item: {
            select: {
              nameTh: true,
              nameEn: true,
              sellerId: true,
            },
          },
        },
      });

      if (!variant) {
        throw new BusinessError(
          "Item variant not found or not available for cart",
          "NOT_FOUND"
        );
      }

      // Prevent users from adding their own items to cart
      if (variant.item.sellerId === userId) {
        throw new BusinessError(
          "Cannot add your own items to cart",
          "BAD_REQUEST"
        );
      }

      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_variantId: {
            userId,
            variantId,
          },
        },
      });

      const currentCartQuantity = existingCartItem
        ? existingCartItem.quantity
        : 0;
      const newTotalCartQuantity = currentCartQuantity + quantity;

      // If new total quantity is 0 or less, remove the item from cart
      if (newTotalCartQuantity <= 0) {
        if (existingCartItem) {
          await prisma.cartItem.delete({
            where: { id: existingCartItem.id },
          });
          return "Item removed from cart successfully";
        } else {
          // If trying to remove an item that's not in the cart, do nothing or throw an error
          // For now, let's return a success message as if it was removed
          return "Item not found in cart, no action needed";
        }
      }

      // Check stock availability for the new total quantity
      if (newTotalCartQuantity > variant.stock) {
        throw new BusinessError(
          `Insufficient stock. Available: ${variant.stock}`,
          "BAD_REQUEST"
        );
      }

      // Add or update item in cart
      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newTotalCartQuantity },
        });
        return "Cart item quantity updated successfully";
      } else {
        await prisma.cartItem.create({
          data: {
            userId,
            itemId,
            variantId,
            quantity: newTotalCartQuantity,
          },
        });
        return "Item added to cart successfully";
      }
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      Logger.error("Error managing cart item", error, { userId, request });
      throw new BusinessError(
        "Failed to manage cart item",
        "INTERNAL_SERVER_ERROR"
      );
    }
  }
}
