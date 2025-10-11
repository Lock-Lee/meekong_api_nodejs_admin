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
    statusFilter?: 'PENDING' | 'WAITING_TO_PAY'  | 'END' | 'COMPLETED'
  ): Promise<{
    satisfies: SatisfyDataAll[];
    total: number;
    countPending: number;
    countWaitingToPay: number;
    countCompleted: number;
  }> {
    const skip = Math.max(0, (page - 1) * pageSize);
    const paidStatuses = [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED];
    let paidBuyerIds: Set<string> | null = null;
  
    // 1) ดึงด้วยเงื่อนไข "คงที่" เท่านั้น (ไม่เอา statusFilter ไปปน)
    const baseWhere: any = {};
    if (itemId) baseWhere.itemId = itemId;
    // Avoid invalid enum value e.g. "COMPLETED" (not in OfferStatus). Also ignore when filtering COMPLETED tab.
    if (status && statusFilter !== 'COMPLETED') {
      const validStatuses = Object.values(OfferStatus) as unknown as string[];
      if (validStatuses.includes(status as unknown as string)) {
        baseWhere.status = status as OfferStatus;
      }
    }
  
    // Map tab names accidentally sent via `status` into `statusFilter`
    const tabNames = new Set(['PENDING', 'WAITING_TO_PAY', 'END', 'COMPLETED']);
    const statusStr = (status as unknown as string | undefined)?.toUpperCase?.();
    if (!statusFilter && statusStr && tabNames.has(statusStr)) {
      statusFilter = statusStr as any;
      status = undefined;
    }

    const rows = await prisma.satisfy.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  
    // 2) เลือกเรคอร์ด "ล่าสุดต่อ buyer" (จากลิสต์ที่เรียง desc แล้ว)
    const seen = new Set<string>();
    const latestPerBuyer: typeof rows = [];
    for (const r of rows) {
      if (!seen.has(r.buyerId)) {
        seen.add(r.buyerId);
        latestPerBuyer.push(r);
      }
    }
  
    // 3) ชุดสถานะ
    const pendingSet   = new Set<OfferStatus>([OfferStatus.OPEN, OfferStatus.NONE, OfferStatus.ADJUST]);
    const waitingSet   = new Set<OfferStatus>([OfferStatus.ACCEPTED]);
    const endSet = new Set<OfferStatus>([OfferStatus.EXPIRED, OfferStatus.REJECT, OfferStatus.CANCELED , OfferStatus.EXPIRED_PAID]);
    const completedSet = new Set<OfferStatus>([OfferStatus.ACCEPTED, OfferStatus.EXPIRED_PAID]);
  
    // 4) ตัวนับ "ตลอดเวลา" (ไม่อิง statusFilter) — คิดจาก latestPerBuyer
    const countersAll = latestPerBuyer.reduce(
      (acc, r) => {
        if (pendingSet.has(r.status)) acc.countPending++;
        else if (waitingSet.has(r.status)) acc.countWaitingToPay++;
        else if (endSet.has(r.status)) acc.countCompleted++;
        return acc;
      },
      { countPending: 0, countWaitingToPay: 0, countCompleted: 0 }
    );
  
    // 5) ทำรายการตามแท็บที่กำลังดู (เฉพาะสำหรับ items + total)
    let filtered = latestPerBuyer;
    if (statusFilter === 'PENDING') {
      filtered = latestPerBuyer.filter(g => pendingSet.has(g.status));
    } else if (statusFilter === 'WAITING_TO_PAY') {
      filtered = latestPerBuyer.filter(g => waitingSet.has(g.status));
    } else if (statusFilter === 'END') {
      filtered = latestPerBuyer.filter(g => endSet.has(g.status));
    } else if (statusFilter === 'COMPLETED') {
      // COMPLETED: เฉพาะสถานะใน completedSet และเอาผู้ที่มีคำสั่งซื้อสถานะจ่ายเงินแล้วขึ้นก่อน
      const completedOnly = latestPerBuyer.filter(g => completedSet.has(g.status));

      // หา buyer ที่มี order จ่ายเงินแล้วสำหรับ item นี้
      const paidList: typeof completedOnly = [];
      for (const r of completedOnly) {
        const targetItemId = r.itemId;
        if (!targetItemId) continue;
        const hasPaid = await prisma.orderItem.findFirst({
          where: {
            itemId: targetItemId,
            order: { status: { in: paidStatuses }, buyerId: r.buyerId },
          },
          select: { id: true },
        });
        if (hasPaid) paidList.push(r);
      }

      // จัดอันดับ: Paid ก่อน แล้วตามด้วยที่เหลือ (completed แต่ยังไม่พบการจ่าย) โดยเรียงตาม createdAt ล่าสุดก่อน
      const paidBuyers = new Set(paidList.map(p => p.buyerId));
      paidBuyerIds = paidBuyers;

      const notPaid = completedOnly.filter(r => !paidBuyers.has(r.buyerId));
      paidList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      notPaid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      filtered = [...paidList, ...notPaid];
    }
  
    // 6) paginate
    const paged = filtered.slice(skip, skip + pageSize);
  
    const now = new Date();
    const items: SatisfyDataAll[] = paged.map(s => {
      const mapped = this.mapToSatisfyData(s);
      const isExpired = s.expireAt ? new Date(s.expireAt) < now : false;
      const isWinner = paidBuyerIds ? paidBuyerIds.has(s.buyerId) : false;
      return {
        ...mapped,
        isExpired,
        isWinner,
      } as SatisfyDataAll;
    });
  
    return {
      satisfies: items,
      total: filtered.length,                    // รวมของแท็บปัจจุบัน
      countPending: countersAll.countPending,    // "นับตลอดเวลา"
      countWaitingToPay: countersAll.countWaitingToPay,
      countCompleted: countersAll.countCompleted,
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


    //  48 minute 
    const expireAtMinute = new Date(Date.now() + 60 * 1000);
    expireAtMinute.setSeconds(0, 0);

    const newSatisfyItem = await prisma.satisfy.create({
      data: {
        itemId: data.itemId,
        variantId: data.variantId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        agreedPrice: data.agreedPrice,
        expireAt: expireAtMinute,
        status: data.status,
      },
    });


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
