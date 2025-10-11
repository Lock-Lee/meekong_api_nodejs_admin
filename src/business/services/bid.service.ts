import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { addMinutes } from "date-fns";
import {
    IBidService,
    IBidRepository,
    BidData,
    CreateBidRequest,
    CreateBidResult,
    BidRankingItem
} from "../interfaces/bid.interfaces";
import { IBuyerPaymentService } from "../interfaces/buyer-payment.interfaces";
import { ValidationError, BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BidService implements IBidService {
    constructor(
        @inject(TYPES.BidRepository) private bidRepository: IBidRepository,
        @inject(TYPES.BuyerPaymentService) private paymentService: IBuyerPaymentService
    ) { }

    /**
     * Get all bids for an auction
     */
    async getBidsByAuction(auctionId: string): Promise<BidData[]> {
        Logger.info("Fetching bids for auction", { auctionId });

        return await this.bidRepository.findBidsByAuction(auctionId);
    }

    /**
     * Create a new bid for an auction
     */
    async createBid(request: CreateBidRequest): Promise<CreateBidResult> {
        const { auctionId, userId, amount, cardToken } = request;

        Logger.info("Creating new bid", { auctionId, userId, amount });

        // 1. Charge payment first (before creating bid)
        let chargeId: string | undefined;
        if (cardToken) {
            try {
                const chargeResponse = await this.paymentService.createCharge({
                    amount: amount * 100, // Convert to satang (smallest currency unit)
                    currency: "thb",
                    card: cardToken,
                    returnUri: `${process.env.FRONTEND_URL}/auction/${auctionId}`,
                    description: `Bid for auction ${auctionId}`,
                });

                if (chargeResponse.status !== "successful") {
                    throw new BusinessError("Payment charge failed", 400);
                }

                chargeId = chargeResponse.id;
                Logger.info("Payment charged successfully", { chargeId, amount });
            } catch (error) {
                Logger.error("Failed to charge payment", { error: (error as Error).message });
                throw new BusinessError("Payment processing failed. Please try again.", 400);
            }
        }

        return await this.bidRepository.executeTransaction(async (repo) => {
            try {
                // 2. Validate auction exists and is active
                await this.validateAuctionActive(auctionId, repo);

                // 3. Validate bid amount
                await this.validateBidAmountInternal(auctionId, amount, repo);

                // 4. Create the bid with chargeId
                const newBid = await repo.createBid({
                    auctionId,
                    userId,
                    amount,
                    chargeId,
                });

                // 5. Update auction with new highest bid
                const auction = await repo.findAuctionById(auctionId);
                if (!auction) {
                    throw new BusinessError("Auction not found", 404);
                }

                // 6. Calculate new end time (if auction has auto-extend)
                let newEndAt = auction.endAt;
                if (auction.extendDurationAfterLastBid) {
                    const remainingTime = auction.endAt.getTime() - new Date().getTime();
                    if (remainingTime < auction.extendDurationAfterLastBid * 60 * 1000) {
                        newEndAt = addMinutes(new Date(), auction.extendDurationAfterLastBid);
                    }
                }

                // 7. Update auction
                const updatedAuction = await repo.updateAuction(auctionId, {
                    currentBid: amount,
                    highestBidderId: userId,
                    endAt: newEndAt,
                });

                Logger.info("Bid created successfully", {
                    bidId: newBid.id,
                    auctionId,
                    newAmount: amount,
                    chargeId
                });

                return { newBid, updatedAuction };
            } catch (error) {
                // If bid creation fails and we already charged, refund it
                if (chargeId) {
                    try {
                        await this.paymentService.refundCharge(chargeId);
                        Logger.info("Payment refunded due to bid creation failure", { chargeId });
                    } catch (refundError) {
                        Logger.error("Failed to refund payment after bid creation failure", {
                            chargeId,
                            error: (refundError as Error).message
                        });
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Get bid ranking for an auction (highest bids per user)
     */
    async getBidRankingByAuction(auctionId: string): Promise<BidRankingItem[]> {
        Logger.info("Fetching bid ranking for auction", { auctionId });

        const bids = await this.bidRepository.findBidsByAuctionOrderedByAmount(auctionId);

        if (bids.length === 0) {
            return [];
        }

        // Get highest bid per user
        const highestBids = new Map<string, BidData>();
        for (const bid of bids) {
            if (!highestBids.has(bid.userId)) {
                highestBids.set(bid.userId, bid);
            }
        }

        // Convert to ranking format
        return Array.from(highestBids.values()).map((bid, index) => ({
            rowNumber: index + 1,
            id: bid.id,
            amount: bid.amount,
            bidAt: bid.bidAt,
            user: {
                id: bid.user?.id || bid.userId,
                firstName: bid.user?.profile?.firstName,
                lastName: bid.user?.profile?.lastName,
                imageUser: bid.user?.profile?.avatarUrl,
            },
            statusAuction: bid.statusAuction,
            paymentExpireAt: bid.paymentExpireAt,
        }));
    }

    /**
     * Validate bid amount is higher than current bid
     */
    async validateBidAmount(auctionId: string, amount: number): Promise<void> {
        await this.validateBidAmountInternal(auctionId, amount, this.bidRepository);
    }

    /**
     * Check if auction is active
     */
    async isAuctionActive(auctionId: string): Promise<boolean> {
        const auction = await this.bidRepository.findAuctionById(auctionId);

        if (!auction) {
            return false;
        }

        return auction.isActive && new Date() <= auction.endAt;
    }

    /**
     * Cancel a bid
     */
    async cancelBid(bidId: string, userId: string): Promise<void> {
        Logger.info("Canceling bid", { bidId, userId });

        return await this.bidRepository.executeTransaction(async (repo) => {
            // 1. Find the bid
            const bid = await repo.findBidById(bidId);
            if (!bid) {
                throw new BusinessError("Bid not found", 404);
            }

            // 2. Verify ownership
            if (bid.userId !== userId) {
                throw new BusinessError("You are not authorized to cancel this bid", 403);
            }

            // 3. Check if auction is still active
            const auction = await repo.findAuctionById(bid.auctionId);
            if (!auction) {
                throw new BusinessError("Auction not found", 404);
            }

            if (!auction.isActive || new Date() > auction.endAt) {
                throw new ValidationError("Cannot cancel bid for an ended auction");
            }

            // 4. Refund payment if there's a charge
            if (bid.chargeId) {
                try {
                    await this.paymentService.refundCharge(bid.chargeId);
                    Logger.info("Payment refunded successfully", {
                        chargeId: bid.chargeId,
                        amount: bid.amount
                    });
                } catch (error) {
                    Logger.error("Failed to refund payment", {
                        chargeId: bid.chargeId,
                        error: (error as Error).message
                    });
                    throw new BusinessError("Failed to process refund. Please contact support.", 500);
                }
            }

            // 5. Check if this is the highest bid
            if (auction.highestBidderId === userId && auction.currentBid === bid.amount) {
                // Need to recalculate highest bid after deletion
                const allBids = await repo.findBidsByAuctionOrderedByAmount(bid.auctionId);

                // Filter out the current bid and find the next highest
                const remainingBids = allBids.filter(b => b.id !== bidId);

                if (remainingBids.length > 0) {
                    // Update auction with the second highest bid
                    await repo.updateAuction(bid.auctionId, {
                        currentBid: remainingBids[0].amount,
                        highestBidderId: remainingBids[0].userId,
                    });
                } else {
                    // No more bids, reset to start price
                    await repo.updateAuction(bid.auctionId, {
                        currentBid: auction.startPrice,
                        highestBidderId: undefined,
                    });
                }
            }

            // 6. Delete the bid
            await repo.deleteBid(bidId);

            Logger.info("Bid canceled successfully", { bidId, auctionId: bid.auctionId });
        });
    }

    // Private helper methods
    private async validateAuctionActive(auctionId: string, repo: IBidRepository): Promise<void> {
        const auction = await repo.findAuctionById(auctionId);

        if (!auction) {
            throw new BusinessError("Auction not found", 404);
        }

        if (!auction.isActive) {
            throw new ValidationError("This auction is not active");
        }

        if (new Date() > auction.endAt) {
            throw new ValidationError("This auction has ended");
        }
    }

    private async validateBidAmountInternal(
        auctionId: string,
        amount: number,
        repo: IBidRepository
    ): Promise<void> {
        const auction = await repo.findAuctionById(auctionId);

        if (!auction) {
            throw new BusinessError("Auction not found", 404);
        }

        const minimumBid = auction.currentBid || auction.startPrice;

        if (amount <= minimumBid) {
            throw new ValidationError(
                `Your bid must be higher than the current bid of ${minimumBid}`
            );
        }
    }
}
