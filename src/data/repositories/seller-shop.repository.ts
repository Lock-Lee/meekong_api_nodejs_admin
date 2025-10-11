import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ISellerShopRepository, SearchItemWithImagesResult, SearchItemsWithCounts } from "../../business/interfaces/seller-shop.intetfaces";
import { PrismaClient, ImageType, Status, Prisma as GeneratedPrisma } from "../../../generated/prisma";

@injectable()
export class SellerShopRepository implements ISellerShopRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    /**
       * Return list of items for a given seller in the same structure as ItemRepository.findById
       */
    async findItemsBySellerId(
        userId: string,
        keyword?: string,
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

        const now = new Date();
        const where: any = {
            sellerId: userId,
        };

        if (status) {
            where.status = status
        }

        if (!status) {
            where.status = { in: [Status.ACTIVE, Status.INACTIVE, Status.DRAFT] }
        }

        if (keyword) {
            where.OR = [
                { nameTh: { contains: keyword } },
                { nameEn: { contains: keyword } }
            ]
        }

        if (itemId) {
            where.id = itemId
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

        // Filter by auction status
        if (auctionStatus) {
            if (auctionStatus === "NOT_STARTED") {
                // มี auction และยังไม่ถึงเวลา startAt
                where.auction = {
                    is: {
                        startAt: { gt: now },
                    }
                };
            } else if (auctionStatus === "IN_PROGRESS") {
                // เลยเวลา startAt แล้ว และยังไม่จบ
                where.auction = {
                    is: {
                        startAt: { lte: now },
                        endAt: { gte: now },
                    }
                };
            } else if (auctionStatus === "COMPLETED") {
                // จบแล้วและมีผู้ชนะ
                where.auction = {
                    is: {
                        OR: [
                            { winnerId: { not: null } },
                            { endAt: { lt: now } }
                        ]
                    }
                };
            }
        }

        // Filter by satisfy status
        if (satisfyStatus) {
            if (satisfyStatus === "SELLING") {
                // กำลังขาย - มี row ใน table Satisfy
                where.status = Status.ACTIVE
                where.NOT = [
                    {
                      AND: [
                        { satisfy: { some: { status: "ACCEPTED" } } },
                        { orderItems: { some: { order: { status: { in: ["PAID", "COMPLETED", "SHIPPED"] } } } } }
                      ]
                    }
                  ];

            } else if (satisfyStatus === "COMPLETED") {
                // เสร็จสิ้น - มี satisfy record และต้องเช็ค record ล่าสุด
                // ใช้วิธีง่ายๆ โดยเช็คว่ามี satisfy record ก่อน แล้วจะไปเช็ค latest record ใน logic หลัง
                // เปลี่ยนเงื่อนไขเป็น: ต้องมี Satisfy ที่ ACCEPTED และมี Order ของ item นี้ที่ชำระเงินแล้ว (Order.status = 'PAID')
                where.AND = [
                    { satisfy: { some: { status: "ACCEPTED" } } },
                    { orderItems: { some: { order: { status: { in: ["PAID", "COMPLETED", "SHIPPED"] } } } } }
                ];
            }
        }



        // Safely default pagination values if undefined or invalid
        const pageNum = page && page > 0 ? page : 1;
        const takeNum = take && take > 0 ? take : 20;
        const skip = (pageNum - 1) * takeNum;



        let orderByClause: any = { createdAt: "desc" };
        switch (sortBy) {
            case "createdAt":
                orderByClause = { createdAt: sortOrder };
                break;
            case "updatedAt":
                orderByClause = { updatedAt: sortOrder };
                break;
            default:
                orderByClause = { createdAt: "desc" };
        }



        // กรณีเรียงตามราคา: หา ID ที่เรียงแล้วตาม _max(price) ของ variant โดยเคารพเงื่อนไข where ปัจจุบัน
        let orderedItemIds: string[] | null = null;
        if (sortBy === "price") {
            const candidate = await this.prisma.item.findMany({ where, select: { id: true } });
            const candidateIds = candidate.map(c => c.id);
            if (candidateIds.length === 0) {
                orderedItemIds = [];
            } else {
                const grouped = await this.prisma.itemVariant.groupBy({
                    by: ["itemId"],
                    where: {
                        itemId: { in: candidateIds },
                        ...(variantPriceFilter ?? {}),
                    },
                    _max: { price: true },
                    orderBy: { _max: { price: sortOrder } },
                    take: takeNum,
                    skip,
                });
                orderedItemIds = grouped.map(g => g.itemId);
            }
        }

        const items = await this.prisma.item.findMany({
            where: {
                ...where,
                ...(sortBy === "price" && orderedItemIds ? { id: { in: orderedItemIds } } : {}),
            },
            ...(sortBy === "price"
                ? { take: orderedItemIds ? orderedItemIds.length : 0, skip: 0 }
                : { take: takeNum, skip }),
            select: {
                id: true,
                nameTh: true,
                nameEn: true,
                itemType: true,
                sellType: true,
                categoryId: true,
                status: true,
                descriptionTh: true,
                descriptionEn: true,
                shippingDuration: true,
                createdAt: true,
                updatedAt: true,
                brand: { select: { id: true, nameTh: true, nameEn: true } },
                itemVariants: {
                    where: variantPriceFilter,
                    select: {
                        sku: true,
                        id: true,
                        price: true,
                        color: true,
                        stock: true,
                        conditionDescription: true,
                        defectNotes: true,
                        includedItems: true,
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
                                        name: true
                                    }
                                },
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
                    select: {
                        id:true,
                        itemId:true,
                        variantId:true,
                        startPrice:true,
                        currentBid:true,
                        buyNowPrice:true,
                        highestBidderId:true,
                        endPrice:true,
                        winnerId:true,
                        finalBidAmount:true,
                        shippingCost:true,
                        commissionRate:true,
                        commissionFee:true,
                        totalAmount:true,
                        startAt:true,
                        endAt:true,
                        isActive:true,
                        createdById:true,
                        createdAt:true,
                        updatedAt:true,
                        winner: {
                            select: {
                                id: true,
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                 
                        bids: userId ? { 
                            where: { userId },
                            select: {
                                id: true,
                                amount: true,
                                bidAt: true,
                                userId: true,
                            },
                            orderBy: { bidAt: 'desc' },
                            take: 1,
                        } : false,
                        _count: { select: { bids: true } },
                        AuctionParticipant: true,
                    },
                },

            },
            ...(sortBy !== "price") ? { orderBy: orderByClause } : {},
        });




        const itemIds = items.map((i: any) => i.id);


        // ดึง satisfy counts ของทุก item ที่ได้มา
        const satisfyGrouped = await this.prisma.satisfy.groupBy({
            by: ['itemId', 'buyerId'],
            where: {
                itemId: { in: itemIds },
            },
        });

        // รวมเป็น count ต่อ itemId
        const satisfyCountByItem: Record<string, number> = {};
        for (const g of satisfyGrouped) {
            satisfyCountByItem[g.itemId] = (satisfyCountByItem[g.itemId] ?? 0) + 1;
        }


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
        // หาก sortBy เป็นราคา ให้เรียง items ให้ตรงกับลำดับ orderedItemIds ก่อน
        let itemsOrdered = items as any[];
        if (sortBy === "price" && orderedItemIds && orderedItemIds.length > 0) {
            const mapById = new Map(items.map(i => [i.id, i]));
            itemsOrdered = orderedItemIds.map(id => mapById.get(id)).filter(Boolean) as any[];
        }


        const results: any[] = [];
        for (const item of itemsOrdered) {

            const variantsWithImages = await this.getVariantsWithImages(item.itemVariants);

            item.itemVariants = variantsWithImages;
            const satisfyCount = satisfyCountByItem[item.id] ?? 0;
            const hasUserBid = userId && item.auction && (item.auction as any).bids?.length > 0;
            const { ...auctionWithoutBids } = (item.auction as any) || {};
            const tags = await this.fetchItemTags(item.id);

            // Query auction winner payment status using auction.id (same logic as bid.repository.ts)
            let statusAuction: 'WAITING_TO_PAID' | 'PAID' | 'EXPIRED_PAID' | 'CANCELED_PAID' | undefined;
            let paymentExpireAt: Date | null = null;

            if (item.auction && (item.auction as any).id && (item.auction as any).winnerId) {
                const auction = item.auction as any;
                
                // หา order ของผู้ชนะประมูล
                const winnerOrder = await this.prisma.order.findFirst({
                    where: {
                        buyerId: auction.winnerId,
                        items: {
                            some: {
                                itemId: auction.itemId,
                            },
                        },
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

                // คำนวณสถานะการจ่ายเงิน
                if (winnerOrder) {
                    const now = new Date();
                    const orderCreatedAt = winnerOrder.createdAt;
                    const hoursSinceCreated = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60);

                    switch (winnerOrder.status) {
                        case 'PENDING':
                            // คำนวณเวลาหมดอายุ (12 ชั่วโมงจากเวลาสร้าง order)
                            paymentExpireAt = new Date(orderCreatedAt.getTime() + 12 * 60 * 60 * 1000);
                            
                            if (hoursSinceCreated > 12) {
                                statusAuction = 'EXPIRED_PAID';
                            } else {
                                statusAuction = 'WAITING_TO_PAID';
                            }
                            break;

                        case 'PAID':
                        case 'SHIPPED':
                        case 'COMPLETED':
                            statusAuction = 'PAID';
                            break;

                        case 'CANCELED':
                            statusAuction = 'CANCELED_PAID';
                            break;
                    }
                }
            }

            results.push({
                ...item,
                auction: item.auction
                    ? {
                        ...auctionWithoutBids,
                        hasUserBid,
                        buyer: (item.auction as any).buyer ? {
                            id: (item.auction as any).buyer.id,
                            profile: (item.auction as any).buyer.profile ? {
                                firstName: (item.auction as any).buyer.profile.firstName,
                                lastName: (item.auction as any).buyer.profile.lastName,
                                avatarUrl: (item.auction as any).buyer.profile.avatarUrl,
                            } : undefined,
                        } : undefined,
                        statusAuction,
                        paymentExpireAt,
                    }
                    : null,
                imageList: imagesByItemId[item.id] || [],
                tags,
                satisfy: [],
                satisfyCount,
                paymentStatus: '',
                paymentExpireDateTime: '',
            });
        }

        // Optimize: compute all counts in a single roundtrip
        const countsByStatus = await this.prisma.item.groupBy({
            by: ["status"],
            where: {
                sellerId: userId,
                status: { in: [Status.ACTIVE, Status.INACTIVE, Status.DRAFT] },
            },
            _count: { _all: true },
        });

        const countActive = countsByStatus.find(c => c.status === Status.ACTIVE)?._count._all ?? 0;
        const countInactive = countsByStatus.find(c => c.status === Status.INACTIVE)?._count._all ?? 0;
        const countDraft = countsByStatus.find(c => c.status === Status.DRAFT)?._count._all ?? 0;
        const countAll = countActive + countInactive + countDraft;


        // Return wrapper object with items and counts
        const resultsWithCounts: SearchItemsWithCounts = {
            items: results,
            countAll,
            countActive,
            countInactive,
            countDraft,
        };

        return resultsWithCounts;
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

    async getVariantsWithImages(itemVariants: any[]) {
        // Collect variant ids
        const variantIds = (itemVariants || []).map((v: any) => v.id).filter(Boolean);
        if (variantIds.length === 0) return [];

        // Fetch variant data in batch
        const variantsData = await this.prisma.itemVariant.findMany({
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
                                name: true
                            }
                        },
                    },

                },
            }
        });

        // Fetch variant images (ImageType.VARIANT) in batch
        const variantImages = await this.prisma.image.findMany({
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

        const imagesByVariantId = variantImages.reduce((acc: Record<string, any[]>, img) => {
            const key = img.targetId as unknown as string;
            if (!acc[key]) acc[key] = [];
            acc[key].push(img);
            return acc;
        }, {} as Record<string, any[]>);

        // Merge
        return variantsData.map((v) => ({
            ...v,
            images: imagesByVariantId[v.id] || [],
        }));
    }
}
