import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IBuyerShopRepository, UserData, SearchItemWithImagesResult, BuyerReviewData, FindBuyerReviewParams } from "../../business/interfaces/buyer-shop.intetfaces";
import { PrismaClient, ImageType, Status, Prisma as GeneratedPrisma } from "../../../generated/prisma";

@injectable()
export class BuyerShopRepository implements IBuyerShopRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    async findSellerProfileById(userId: string): Promise<UserData | null> {
        const seller = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true, Shop: true },
        });
        return seller ? this.mapToUserData(seller as any) : null;

    }

    private mapToUserData(user: any): UserData {
        return {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            profile: {
                firstName: user.profile?.firstName,
                lastName: user.profile?.lastName,
                avatarUrl: user.profile?.avatarUrl,
                userId: user.id,
                createdAt: user.profile?.createdAt ?? user.createdAt,
                updatedAt: user.profile?.updatedAt ?? user.updatedAt,
                countFollowers: 0,
                countPositiveReviews: 0,
            },
            Shop: Array.isArray(user.Shop) && user.Shop.length
                ? user.Shop.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    avatarUrl: s.avatarUrl,
                    bannerUrl: s.bannerUrl,
                    slug: s.slug,
                }))
                : undefined,
        };
    }

    /**
     * Return list of items for a given seller in the same structure as ItemRepository.findById
     */
    async findItemsBySellerId(userId: string, keyword?: string, categoryId?: string[], sellType?: string[], itemType?: string[], minPrice?: number, maxPrice?: number, page?: number, take?: number): Promise<SearchItemWithImagesResult[]> {


        const where: any = {
            status: Status.ACTIVE,
            sellerId: userId,
        };

        if (keyword) {
            where.OR = [
                { nameTh: { contains: keyword } },
                { nameEn: { contains: keyword } }
            ]
        }

        if (categoryId && categoryId.length > 0) {
            where.categoryId = { in: categoryId }
        }
        if (sellType && sellType.length > 0) {
            where.sellType = { in: sellType }
        }

        if (itemType && itemType.length > 0) {
            where.itemType = { in: itemType }
        }


        let priceGte: number | undefined = minPrice;
        let priceLte: number | undefined = maxPrice;
        if (
            typeof priceGte === "number" &&
            typeof priceLte === "number" &&
            priceGte > priceLte
        ) {
            [priceGte, priceLte] = [priceLte, priceGte];
        }

        const variantPriceFilter: GeneratedPrisma.ItemVariantWhereInput | undefined =
            priceGte !== undefined || priceLte !== undefined
                ? {
                    price: {
                        ...(priceGte !== undefined && { gte: priceGte }),
                        ...(priceLte !== undefined && { lte: priceLte }),
                    },
                }
                : undefined;

        if (variantPriceFilter) {
            where.itemVariants = { some: variantPriceFilter };
        }

        // Safely default pagination values if undefined or invalid
        const pageNum = page && page > 0 ? page : 1;
        const takeNum = take && take > 0 ? take : 20;
        const skip = (pageNum - 1) * takeNum;




        const items = await this.prisma.item.findMany({
            where,
            take: takeNum,
            skip,
            select: {
                id: true,
                nameTh: true,
                nameEn: true,
                itemType: true,
                sellType: true,
                categoryId: true,
                category: { select: { id: true, nameTh: true, nameEn: true  , imageUrl: true } },
                brand: { select: { id: true, nameTh: true, nameEn: true } },
                itemVariants: {
                    where: variantPriceFilter,
                    select: {
                        id: true,
                        price: true,
                        color: true,
                        stock: true,
                        conditionDescription: true,
                        defectNotes: true,
                        includedItems: true,
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
                        profile: {
                            select: {
                                avatarUrl: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        Shop: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                                bannerUrl: true,
                                slug: true,
                            },
                        },
                    },
                },
                auction: {
                    include: {
                        bids: userId ? { where: { userId } } : false,
                        _count: { select: { bids: true } },
                        AuctionParticipant: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const itemIds = items.map((i: any) => i.id);
        const images = await this.prisma.image.findMany({
            where: { targetId: { in: itemIds }, type: ImageType.ITEM },
            select: { id: true, targetId: true, imageUrl: true, isPrimary: true },
            orderBy: { isPrimary: "desc" },
        });

        const imagesByItemId = images.reduce((acc: Record<string, typeof images>, img: any) => {
            (acc[img.targetId] ||= []).push(img);
            return acc;
        }, {} as Record<string, typeof images>);

        // Attach images, tags, and adjust auction object similar to findById
        const results: any[] = [];
        for (const item of items) {
            const hasUserBid = userId && item.auction && (item.auction as any).bids?.length > 0;
            const { ...auctionWithoutBids } = (item.auction as any) || {};
            const tags = await this.fetchItemTags(item.id);
            results.push({
                ...item,
                auction: item.auction
                    ? {
                        ...auctionWithoutBids,
                        hasUserBid,
                    }
                    : null,
                imageList: imagesByItemId[item.id] || [],
                tags,
            });
        }

        return results;
    }

    private async fetchItemTags(itemId: string): Promise<string[]> {
        const tagLinks = await this.prisma.tagLink.findMany({
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

        return tagLinks.map((link: any) => link.tag.name);
    }

    async findCategoryBySellerId(
        userId: string,
        lang: "th" | "en" = "th"
    ): Promise<Array<{ categoryId: string; categoryName: string; count: number; imageUrl: string | null }>> {
        // 1) นับจำนวน item ต่อหมวด
        const grouped = await this.prisma.item.groupBy({
          by: ["categoryId"],
          where: { sellerId: userId, status: Status.ACTIVE },
          _count: { id: true },
        });
        if (!grouped.length) return [];
      
        const categoryIds = grouped.map(g => g.categoryId as string);
      
        // 2) ดึงชื่อหมวดทั้งหมดทีเดียว
        const categories = await this.prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, nameTh: true, nameEn: true  , imageUrl: true },
        });
      
        // // 3) ดึงรูปของทุกหมวดทีเดียว (เรียงให้รูปหลักมาก่อน ถ้าใช้ isPrimary)
        // const images = await this.prisma.image.findMany({
        //   where: { type: ImageType.CATEGORY, targetId: { in: categoryIds } },
        //   select: { targetId: true, imageUrl: true, isPrimary: true },
        //   orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
        // });
      
        // 4) สร้าง map เพื่อประกอบผลลัพธ์
        const catMap = new Map(categories.map(c => [c.id, c]));
        // const imgMap = new Map<string, string[]>();
        // for (const img of images) {
        //   if (!imgMap.has(img.targetId)) imgMap.set(img.targetId, []);
        //   imgMap.get(img.targetId)!.push(img.imageUrl);
        // }
      
        // 5) รวมผลลัพธ์ (ไม่มี await ซ้อนใน map แล้ว)
        return grouped.map(g => {
          const id = g.categoryId as string;
          const c = catMap.get(id);
          const name =
            lang === "th"
              ? (c?.nameTh || c?.nameEn || "")
              : (c?.nameEn || c?.nameTh || "");
          return {
            categoryId: id,
            categoryName: name,
            count: g._count.id,
            imageUrl: c?.imageUrl ?? null,
          };
        });
      }
      


    async findBuyerReviewBySellerId(userId: string, shopId: string, params: FindBuyerReviewParams = {}): Promise<BuyerReviewData[]> {

        const { take = 20, skip = 0 } = params;

        const where = {
            ...(userId ? { userId } : {}),
            ...(shopId ? { shopId } : {}),
        };

        const rows = await this.prisma.shopReview.findMany({
            where,
            take,
            skip,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shopId: true,
                userId: true,
                rating: true,
                comment: true,
                images: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                avatarUrl: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            }
        });

        return rows.map((r) => this.mapToBuyerReviewData(r));

    }
    private mapToBuyerReviewData(review: any): BuyerReviewData {
        return {
            id: review.id,
            shopId: review.shopId,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment ?? undefined,
            images: review.images,
            status: review.status,
            createdAt: review.createdAt,
            user: {
                id: review.user.id,
                profile: {
                    avatarUrl: review.user.profile.avatarUrl,
                    firstName: review.user.profile.firstName,
                    lastName: review.user.profile.lastName,
                },
            },
        };
    }
}

