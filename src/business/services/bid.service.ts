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
import { ValidationError, BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BidService implements IBidService {
    constructor(
        @inject(TYPES.BidRepository) private bidRepository: IBidRepository
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
        const { auctionId, userId, amount } = request;

        Logger.info("Creating new bid", { auctionId, userId, amount });

        return await this.bidRepository.executeTransaction(async (repo) => {
            // 1. Validate auction exists and is active
            await this.validateAuctionActive(auctionId, repo);

            // 2. Validate bid amount
            await this.validateBidAmountInternal(auctionId, amount, repo);

            // 3. Create the bid
            const newBid = await repo.createBid({
                auctionId,
                userId,
                amount,
            });

            // 4. Update auction with new highest bid
            const auction = await repo.findAuctionById(auctionId);
            if (!auction) {
                throw new BusinessError("Auction not found", 404);
            }

            // 5. Calculate new end time (if auction has auto-extend)
            let newEndAt = auction.endAt;
            if (auction.extendDurationAfterLastBid) {
                const remainingTime = auction.endAt.getTime() - new Date().getTime();
                if (remainingTime < auction.extendDurationAfterLastBid * 60 * 1000) {
                    newEndAt = addMinutes(new Date(), auction.extendDurationAfterLastBid);
                }
            }

            // 6. Update auction
            const updatedAuction = await repo.updateAuction(auctionId, {
                currentBid: amount,
                highestBidderId: userId,
                endAt: newEndAt,
            });

            Logger.info("Bid created successfully", {
                bidId: newBid.id,
                auctionId,
                newAmount: amount
            });

            return { newBid, updatedAuction };
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
