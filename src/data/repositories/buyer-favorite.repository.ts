import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";

import {
  BuyerFavoriteData,
  CreateBuyerFavoriteData,
  IBuyerFavoriteRepository,
} from "@business/interfaces/buyer-favorite.interfaces";
import { PrismaClient } from "../../../generated/prisma";
@injectable()
export class BuyerFavoriteRepository implements IBuyerFavoriteRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) { }
  async findBuyerFavoritesByBuyerId(
    buyerId: string
  ): Promise<BuyerFavoriteData[]> {
    const result = await this.prisma.wishlist.findMany({
      where: { userId: buyerId },
      include: {
        item: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              include: {
                image: true
              }
            },
            category: true,
            brand: true,
            seller: true,
            Shop: true,
            itemVariants: {
              include: {
                sizes: true
              }
            }
          }
        },
        variant: {
          include: {
            sizes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return result.map((item) => ({
      ...item,
      variantId: item.variantId ?? undefined,
    }));
  }
  async createBuyerFavorite(
    data: CreateBuyerFavoriteData
  ): Promise<BuyerFavoriteData> {
    const result = await this.prisma.wishlist.create({
      data: data,
      include: {
        item: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              include: {
                image: true
              }
            },
            category: true,
            brand: true,
            seller: true,
            Shop: true,
            itemVariants: {
              include: {
                sizes: true
              }
            }
          }
        },
        variant: {
          include: {
            sizes: true
          }
        }
      }
    });
    return {
      ...result,
      variantId: result.variantId ?? undefined,
    };
  }
  async deleteBuyerFavorite(id: string): Promise<void> {
    await this.prisma.wishlist.delete({
      where: { id },
    });
  }

  async findBuyerFavoriteByCriteria(
    userId: string,
    itemId: string,
    variantId?: string
  ): Promise<BuyerFavoriteData | null> {
    const whereClause = {
      userId,
      itemId,
      variantId: variantId || null
    };

    const result = await this.prisma.wishlist.findFirst({
      where: whereClause,
      include: {
        item: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              include: {
                image: true
              }
            },
            category: true,
            brand: true,
            seller: true,
            Shop: true,
            itemVariants: {
              include: {
                sizes: true
              }
            }
          }
        },
        variant: {
          include: {
            sizes: true
          }
        }
      }
    });

    if (!result) {
      return null;
    }

    return {
      ...result,
      variantId: result.variantId ?? undefined,
    };
  }
}
