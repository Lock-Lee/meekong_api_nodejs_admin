import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IBidRepository,
    BidData,
    AuctionData
} from "../../business/interfaces/bid.interfaces";

@injectable()
export class BidRepository implements IBidRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Find bids by auction ID, ordered by bid time (newest first)
     */
    async findBidsByAuction(auctionId: string): Promise<BidData[]> {
        const bids = await this.prisma.bid.findMany({
            where: { auctionId },
            orderBy: { bidAt: "desc" },
            include: {
                user: {
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
        });

        return bids.map((bid: any) => this.mapToBidData(bid));
    }

    /**
     * Find bids by auction ID, ordered by amount (highest first)
     */
    async findBidsByAuctionOrderedByAmount(auctionId: string): Promise<BidData[]> {
        const bids = await this.prisma.bid.findMany({
            where: { auctionId },
            orderBy: { amount: "desc" },
            include: {
                user: {
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
        });

        return bids.map((bid: any) => this.mapToBidData(bid));
    }

    /**
     * Create a new bid
     */
    async createBid(data: Omit<BidData, 'id' | 'bidAt' | 'user'>): Promise<BidData> {
        const bid = await this.prisma.bid.create({
            data: {
                auctionId: data.auctionId,
                userId: data.userId,
                amount: data.amount,
            },
            include: {
                user: {
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
        });

        return this.mapToBidData(bid);
    }

    /**
     * Find auction by ID
     */
    async findAuctionById(auctionId: string): Promise<AuctionData | null> {
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
        });

        return auction ? this.mapToAuctionData(auction) : null;
    }

    /**
     * Update auction data
     */
    async updateAuction(auctionId: string, data: Partial<AuctionData>): Promise<AuctionData> {
        const updateData: any = {};

        if (data.currentBid !== undefined) updateData.currentBid = data.currentBid;
        if (data.highestBidderId !== undefined) updateData.highestBidderId = data.highestBidderId;
        if (data.endAt !== undefined) updateData.endAt = data.endAt;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const auction = await this.prisma.auction.update({
            where: { id: auctionId },
            data: updateData,
        });

        return this.mapToAuctionData(auction);
    }

    /**
     * Execute operations in a transaction
     */
    async executeTransaction<T>(callback: (repository: IBidRepository) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (tx: any) => {
            const transactionRepo = new BidRepository(tx);
            return await callback(transactionRepo);
        });
    }

    // Mappers
    private mapToBidData(bid: any): BidData {
        return {
            id: bid.id,
            auctionId: bid.auctionId,
            userId: bid.userId,
            amount: bid.amount,
            bidAt: bid.bidAt,
            user: bid.user ? {
                id: bid.user.id,
                profile: bid.user.profile ? {
                    firstName: bid.user.profile.firstName,
                    lastName: bid.user.profile.lastName,
                    avatarUrl: bid.user.profile.avatarUrl,
                } : undefined,
            } : undefined,
        };
    }

    private mapToAuctionData(auction: any): AuctionData {
        return {
            id: auction.id,
            isActive: auction.isActive,
            endAt: auction.endAt,
            currentBid: auction.currentBid?.toNumber(),
            startPrice: auction.startPrice.toNumber(),
            highestBidderId: auction.highestBidderId,
            extendDurationAfterLastBid: auction.extendDurationAfterLastBid,
        };
    }
}
