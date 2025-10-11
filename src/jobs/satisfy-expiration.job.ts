import { prisma } from "../data/database/db";
import { Logger } from "../shared/utils/logger";
import { OfferStatus, OrderStatus } from "../../generated/prisma";

/**
 * Expire Satisfy records where expireAt <= now and status is not a terminal one.
 */
export async function runSatisfyExpirationJob() {
  const now = new Date();

  // Non-terminal statuses that can be auto-expired
  const activeStatuses: OfferStatus[] = [
    OfferStatus.OPEN,
    OfferStatus.NONE,
    OfferStatus.ADJUST,
  ];

  try {

    Logger.info("Satisfy expiration job: running", { now });
    // Rule 1: expire records (create a new row with status EXPIRED) for those past expireAt and still active
    const toExpire = await prisma.satisfy.findMany({
      where: {
        expireAt: { lte: now },
        status: { in: activeStatuses },
      },
      select: {
        id: true,
        itemId: true,
        variantId: true,
        buyerId: true,
        sellerId: true,
        agreedPrice: true,
        shippingCost: true,
        commissionRate: true,
        commissionFee: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    let createdExpired = 0;
    for (const s of toExpire) {
      // Idempotency: skip if an EXPIRED record already exists for same buyer+item created after this base
      const alreadyCreated = await prisma.satisfy.findFirst({
        where: {
          itemId: s.itemId,
          buyerId: s.buyerId,
          status: OfferStatus.EXPIRED,
          createdAt: { gte: s.createdAt },
        },
        select: { id: true },
      });
      if (alreadyCreated) continue;

      await prisma.satisfy.create({
        data: {
          itemId: s.itemId,
          variantId: s.variantId ?? undefined,
          buyerId: s.buyerId,
          sellerId: s.sellerId,
          agreedPrice: s.agreedPrice,
          shippingCost: s.shippingCost,
          commissionRate: s.commissionRate,
          commissionFee: s.commissionFee,
          totalAmount: s.totalAmount,
          status: OfferStatus.EXPIRED,
        },
      });
      createdExpired++;
    }
    if (createdExpired > 0) {
      Logger.info("Satisfy expiration job: created EXPIRED records", { count: createdExpired });
    }

    // Additional rule: any ACCEPTED satisfy without a paid/completed/shipped order should be EXPIRED
    const accepted = await prisma.satisfy.findMany({
      where: { status: OfferStatus.ACCEPTED, expireAt: { lte: now } },
      select: { id: true, itemId: true, variantId: true },
    });

    let createdExpiredPaid = 0;
    for (const s of accepted) {
      const hasPaidOrder = await prisma.orderItem.findFirst({
        where: {
          itemId: s.itemId,
          ...(s.variantId ? { variantId: s.variantId } : {}),
          order: { status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED] } },
        },
        select: { id: true },
      });
      if (hasPaidOrder) continue;

      // Idempotency: skip if an EXPIRED_PAID already created
      const alreadyCreated = await prisma.satisfy.findFirst({
        where: {
          itemId: s.itemId,
          buyerId: (await prisma.satisfy.findUnique({ where: { id: s.id }, select: { buyerId: true } }))!.buyerId,
          status: OfferStatus.EXPIRED_PAID,
          createdAt: { gte: now },
        },
        select: { id: true },
      });
      if (alreadyCreated) continue;

      // Load base data of this satisfy to copy fields
      const base = await prisma.satisfy.findUnique({
        where: { id: s.id },
        select: {
          itemId: true,
          variantId: true,
          buyerId: true,
          sellerId: true,
          agreedPrice: true,
          shippingCost: true,
          commissionRate: true,
          commissionFee: true,
          totalAmount: true,
        },
      });
      if (!base) continue;

      await prisma.satisfy.create({
        data: {
          itemId: base.itemId,
          variantId: base.variantId ?? undefined,
          buyerId: base.buyerId,
          sellerId: base.sellerId,
          agreedPrice: base.agreedPrice,
          shippingCost: base.shippingCost,
          commissionRate: base.commissionRate,
          commissionFee: base.commissionFee,
          totalAmount: base.totalAmount,
          status: OfferStatus.EXPIRED_PAID,
        },
      });
      createdExpiredPaid++;
    }
    if (createdExpiredPaid > 0) {
      Logger.info("Satisfy expiration job: created EXPIRED_PAID records (ACCEPTED without payment)", { count: createdExpiredPaid });
    }
  } catch (err: any) {
    Logger.error("Satisfy expiration job failed", { error: err?.message || String(err) });
  }
}
