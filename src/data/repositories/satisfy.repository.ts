import { injectable } from "inversify";
import { prisma } from "../database/db";
import {
  ISatisfyRepository,
  SatisfyData,
  SatisfyDataAll,
  SatisfyDataById,
} from "../../business/interfaces/satisfy.interfaces";
// import { ImageType } from "../../../generated/prisma";
import { OfferStatus, OrderStatus } from "../../../generated/prisma";

@injectable()
export class SatisfyRepository implements ISatisfyRepository {
  async findSatisfies(
    page: number,
    pageSize: number,
    itemId?: string,
    status?: OfferStatus,
    statusFilter?: string
  ): Promise<{ satisfies: SatisfyDataAll[]; total: number; topPrice: number }> {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (itemId) {
      where.itemId = itemId;
    }
    if (status) {
      where.status = status;
    }


// if (statusFilter === 'PENDING') {
//   where.status = { in: [OfferStatus.OPEN, OfferStatus.NONE, OfferStatus.OFFER] };
// }

// if (statusFilter === 'WAITING_TO_PAY') {
//   where.status = { in: [OfferStatus.ACCEPTED] , not: OfferStatus.ADJUST };
// }

// if (statusFilter === 'COMPLETED') {
//   where.status = { in: [OfferStatus.EXPIRED, OfferStatus.REJECT, OfferStatus.CANCELED] };
// }



    const [satisfies, total] = await Promise.all([
      prisma.satisfy.findMany({
        where: where,
        orderBy: { createdAt: "desc" },
        include: {
          // item: {
          //   include: {
          //     orderItems: {
          //       include: {
          //         order: true,
          //       },
          //     },
          //   },
          // },
          buyer: {
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
        },
      }),
      prisma.satisfy.count({ where: where }),
    ]);

    // Group by buyerId to get the latest record per buyer (only when not skipping)
    const seen = new Set<string>();
    const grouped = [] as any[];
    for (const s of satisfies) {
        if (!seen.has(s.buyerId)) {
          seen.add(s.buyerId);
          grouped.push(s);
        }
      }

    // Sort: top price first, then the rest by createdAt DESC (only when grouping)
    let topEntry: any | undefined;
    if (grouped.length) {
      topEntry = grouped.reduce((best, cur) => {
        const bestPrice = Number(best.agreedPrice ?? 0);
        const curPrice = Number(cur.agreedPrice ?? 0);
        if (curPrice > bestPrice) return cur;
        if (curPrice < bestPrice) return best;
        // tie-breaker: earlier createdAt wins
        return new Date(cur.createdAt) < new Date(best.createdAt) ? cur : best;
      }, grouped[0]);
    }

    let ordered: any[] = [];
    if (grouped.length) {
      // Already ordered by createdAt desc from the query
      ordered = satisfies as any[];
    } else {
      const rest = grouped.filter((g) => g.id !== (topEntry?.id ?? ""));
      rest.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      ordered = topEntry ? [topEntry, ...rest] : rest;
    }

    // Pagination applied on ordered list
    const start = skip;
    const end = skip + pageSize;
    const paged = ordered.slice(start, end);

    const now = new Date();
    const items: SatisfyDataAll[] = paged.map((satisfy) => {
      const mapped = this.mapToSatisfyData(satisfy);
      const isPaid = Number((satisfy as any).totalAmount ?? 0) > 0;
      const isExpired = satisfy.expireAt ? new Date(satisfy.expireAt) < now : false;
      return { ...mapped, isPaid, isExpired } as SatisfyDataAll;
    });

    const collectionForTop = grouped;
    const topPrice = collectionForTop.length
      ? Math.max(...collectionForTop.map((g) => Number(g.agreedPrice ?? 0)))
      : 0;

    return {
      satisfies: items,
      total: grouped.length,
      topPrice,
    };
  }


  async findMonitorStatusSatisfy(
    page: number,
    pageSize: number,
    itemId?: string,
    status?: OfferStatus,
    statusFilter?: string
  ): Promise<{
    satisfies: SatisfyDataAll[];
    total: number;
    countPending: number;
    countWaitingToPay: number;
    countCompleted: number;
  }> {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (itemId) {
      where.itemId = itemId;
    }
    if (status) {
      where.status = status;
    }

    let whereStatus: any = {};

    if (statusFilter === 'WAITING_TO_PAY') {
      whereStatus.status = OrderStatus.PENDING;
    }

    if (statusFilter === 'COMPLETED') {
      whereStatus.status = { not: OrderStatus.PENDING };
    }

    const orderItemsWhere = whereStatus.status
      ? { order: { status: whereStatus.status } }
      : undefined;

    const satisfyWhere = (statusFilter === 'PENDING')
      ? {
        ...where,
        item: {
          is: {
            orderItems: {
              none: {},
            },
          },
        },
      }
      : (whereStatus.status
        ? {
          ...where,
          item: {
            is: {
              orderItems: {
                some: {
                  order: {
                    is: { status: whereStatus.status },
                  },
                },
              },
            },
          },
        }
        : where);

        // Build base where for counts (independent from current statusFilter)
        const baseWhereForCounts = { ...where } as any;

        const [satisfies, total, countPending, countWaitingToPay, countCompleted] = await Promise.all([
          prisma.satisfy.findMany({
            where: satisfyWhere,
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
            include: {
              item: {
                include: {
                  orderItems: (
                    orderItemsWhere
                      ? { where: orderItemsWhere, include: { order: true } }
                      : { include: { order: true } }
                  ) as any,
                },
              },
              buyer: {
                select: {
                  id: true,
                  profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
              },
            },
          }),


          
          prisma.satisfy.count({ where: satisfyWhere }),
          // Pending: no orderItems
          prisma.satisfy.count({
            where: {
              ...baseWhereForCounts,
              item: { is: { orderItems: { none: {} } } },
            },
          }),
          // Waiting to pay: has order with status PENDING
          prisma.satisfy.count({
            where: {
              ...baseWhereForCounts,
              item: {
                is: {
                  orderItems: {
                    some: { order: { is: { status: OrderStatus.PENDING } } },
                  },
                },
              },
            },
          }),
          // Completed: has order with status not PENDING
          prisma.satisfy.count({
            where: {
              ...baseWhereForCounts,
              item: {
                is: {
                  orderItems: {
                    some: { order: { is: { status: { not: OrderStatus.PENDING } } } },
                  },
                },
              },
            },
          }),
        ]);
        
    // Special handling for PENDING: group by buyerId and take latest per buyer, paginate after grouping
    if (statusFilter === 'PENDING') {
      const allPending = await prisma.satisfy.findMany({
        where: satisfyWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          item: {
            include: {
              orderItems: (
                orderItemsWhere
                  ? { where: orderItemsWhere, include: { order: true } }
                  : { include: { order: true } }
              ) as any,
            },
          },
          buyer: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      });

      const seenBuyer = new Set<string>();
      const latestPerBuyer: any[] = [];
      for (const s of allPending) {
        if (!seenBuyer.has(s.buyerId)) {
          seenBuyer.add(s.buyerId);
          latestPerBuyer.push(s);
        }
      }

      const totalUnique = latestPerBuyer.length;
      const start = skip;
      const end = skip + pageSize;
      const pagedGrouped = latestPerBuyer.slice(start, end);

      const nowPending = new Date();
      const itemsPending: SatisfyDataAll[] = pagedGrouped.map((s) => {
        const mapped = this.mapToSatisfyData(s);
        const isPaid = Number((s as any).totalAmount ?? 0) > 0;
        const isExpired = s.expireAt ? new Date(s.expireAt) < nowPending : false;
        return { ...mapped, isPaid, isExpired } as SatisfyDataAll;
      });

      return {
        satisfies: itemsPending,
        total: totalUnique,
        countPending:totalUnique,
        countWaitingToPay,
        countCompleted,
      };
    }

    // Default mapping for other filters
    const now = new Date();
    const items: SatisfyDataAll[] = satisfies.map((s) => {
      const mapped = this.mapToSatisfyData(s);
      const isPaid = Number((s as any).totalAmount ?? 0) > 0;
      const isExpired = s.expireAt ? new Date(s.expireAt) < now : false;
      return { ...mapped, isPaid, isExpired } as SatisfyDataAll;
    });

    return {
      satisfies: items,
      total: total,
      countPending,
      countWaitingToPay,
      countCompleted,
    };
  }


  
  async findSatisfyById(
    itemId: string,
    buyerId?: string
  ): Promise<SatisfyDataById[]> {
    const where: any = { itemId };
    if (buyerId) {
      where.buyerId = buyerId;
    }


    const satisfyItems = await prisma.satisfy.findMany({
      where,
      take: 2, // Fetch the top 2
      include: {
        item: {
          include: {
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
          },
        },
        buyer: {
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
        seller: {
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
      },
      orderBy: { createdAt: "desc" },
    });

    // if (!satisfyItems || satisfyItems.length === 0) {
    //   return Send.error(res, null, "Satisfy item not found.");
    // }

    // The most recent item is the first in the array
    const currentSatisfyItem = satisfyItems[0];
    // The previous item (if it exists) is the second
    const previousSatisfyItem =
      satisfyItems.length > 1 ? satisfyItems[1] : null;

    // 3. Fetch images for the item
    // const images = await prisma.image.findMany({
    //   where: {
    //     targetId: currentSatisfyItem.item.id,
    //     type: ImageType.ITEM,
    //   },
    //   select: {
    //     id: true,
    //     imageUrl: true,
    //     isPrimary: true,
    //   },
    //   orderBy: { isPrimary: "desc" },
    // });

    // The most recent item is the first in the array
    // const currentSatisfyItem = satisfies[0];
    // // The previous item (if it exists) is the second
    // const previousSatisfyItem = satisfyItems.length > 1 ? satisfies[1] : null;
    console.log("ddd " + previousSatisfyItem);
    const result = [
      {
        ...currentSatisfyItem,
        amountBefore: previousSatisfyItem
          ? previousSatisfyItem.agreedPrice
          : "0", // Add amountBefore
        // item: {
        //   ...currentSatisfyItem.item,
        //   images: images,
        // },
      },
    ];

    return result.map((satisfy) => this.mapToSatisfyDataById(satisfy));

    // return this.mapToSatisfyDataById(result);
  }

  async createSatisfy(
    data: Omit<SatisfyData, "id" | "createdAt" | "updatedAt">
  ): Promise<SatisfyData> {
    console.log(data);

    const newSatisfyItem = await prisma.satisfy.create({
      data: {
        itemId: data.itemId,
        variantId: data.variantId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        agreedPrice: data.agreedPrice,
        status: data.status,
      },
    });
    // const satisfy = await prisma.satisfy.create({
    //   data: {
    //     itemId: data.itemId,
    //     variantId: data.variantId,
    //     buyerId: data.buyerId,
    //     sellerId: data.sellerId,
    //     agreedPrice: data.agreedPrice,
    //     status: data.status,
    //   },
    // });

    return this.mapToSatisfyData(newSatisfyItem);
  }

  private mapToSatisfyData(satisfy: any): SatisfyData {
    return {
      id: satisfy.id,
      itemId: satisfy.itemId,
      variantId: satisfy.variantId ?? undefined,
      buyerId: satisfy.buyerId,
      sellerId: satisfy.sellerId,
      agreedPrice: Number(satisfy.agreedPrice ?? 0),
      amountBefore: Number(satisfy.amountBefore ?? 0),
      expireAt: satisfy.expireAt ?? null,
      status: satisfy.status,
      createdAt: satisfy.createdAt,
      updatedAt: satisfy.updatedAt,
      buyer: satisfy.buyer
        ? {
          id: satisfy.buyer.id,
          profile: satisfy.buyer.profile
            ? {
              firstName: satisfy.buyer.profile.firstName ?? null,
              lastName: satisfy.buyer.profile.lastName ?? null,
              avatarUrl: satisfy.buyer.profile.avatarUrl ?? null,
            }
            : null,
        }
        : undefined,
      item: satisfy.item
        ? {
          id: satisfy.item.id,
          // include optional fields if present
          name: satisfy.item.name,
          description: satisfy.item.description,
          price: typeof satisfy.item.price !== 'undefined' ? Number(satisfy.item.price) : undefined,
          stock: satisfy.item.stock,
          createdAt: satisfy.item.createdAt,
          updatedAt: satisfy.item.updatedAt,
          orderItems: Array.isArray(satisfy.item.orderItems)
            ? satisfy.item.orderItems.map((oi: any) => ({
                id: oi.id,
                status: oi.order?.status,
                createdAt: oi.order?.createdAt ?? oi.createdAt,
                updatedAt: oi.order?.updatedAt ?? oi.updatedAt,
                order: oi.order,
              }))
            : undefined,
        }
        : undefined,
    };

  }




  private mapToSatisfyDataById(satisfy: any): SatisfyDataById {
    return {
      id: satisfy.id ?? "",
      itemId: satisfy.itemId ?? "",
      variantId: satisfy.variantId ?? undefined,
      buyerId: satisfy.buyerId ?? "",
      sellerId: satisfy.sellerId ?? "",
      agreedPrice: Number(satisfy.agreedPrice ?? 0),
      amountBefore: Number(satisfy.amountBefore ?? 0),
      status: satisfy.status ?? "NONE",
      createdAt: satisfy.createdAt ?? new Date(),
      updatedAt: satisfy.updatedAt ?? new Date(),
    };
  }
}
