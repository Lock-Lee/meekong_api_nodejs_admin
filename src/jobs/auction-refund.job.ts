import { prisma } from "../data/database/db";
import { Logger } from "../shared/utils/logger";
import { AuctionParticipantStatus } from "../../generated/prisma";

/**
 * Refund deposit for auction participants who didn't win
 * - Process auctions that have ended and have a winner
 * - Refund deposits to participants who didn't win
 */
export async function runAuctionRefundJob() {
  const now = new Date();

  try {
    Logger.info("Auction refund job: running", { now });

    // Find auctions that have ended and have a winner
    const endedAuctions = await prisma.auction.findMany({
      where: {
        endAt: { lte: now },
        winnerId: { not: null },
      },
      select: {
        id: true,
        winnerId: true,
        itemId: true,
      },
    });

    Logger.info("Auction refund job: found ended auctions", { 
      count: endedAuctions.length 
    });

    let refundedCount = 0;
    let alreadyRefundedCount = 0;

    for (const auction of endedAuctions) {
      // Skip if winnerId is somehow null (shouldn't happen due to query filter)
      if (!auction.winnerId) continue;

      // Find participants who paid deposit but didn't win
      const participants = await prisma.auctionParticipant.findMany({
        where: {
          auctionId: auction.id,
          status: AuctionParticipantStatus.PAID,
          userId: { not: auction.winnerId },
        },
        select: {
          id: true,
          userId: true,
          depositAmount: true,
          refundedAt: true,
        },
      });

      for (const participant of participants) {
        // Skip if already refunded
        if (participant.refundedAt) {
          alreadyRefundedCount++;
          continue;
        }

        // Update participant status to REFUNDED
        await prisma.auctionParticipant.update({
          where: { id: participant.id },
          data: {
            status: AuctionParticipantStatus.REFUNDED,
            refundedAt: now,
          },
        });

        refundedCount++;

        Logger.info("Auction refund job: refunded deposit", {
          participantId: participant.id,
          userId: participant.userId,
          auctionId: auction.id,
          amount: participant.depositAmount.toString(),
        });
      }
    }

    if (refundedCount > 0 || alreadyRefundedCount > 0) {
      Logger.info("Auction refund job: completed", {
        refundedCount,
        alreadyRefundedCount,
        totalProcessed: refundedCount + alreadyRefundedCount,
      });
    }
  } catch (err: any) {
    Logger.error("Auction refund job failed", { 
      error: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
