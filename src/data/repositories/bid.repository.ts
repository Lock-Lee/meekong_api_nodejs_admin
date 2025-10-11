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
        // ดึงข้อมูล auction เพื่อหา winnerId
        const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
            select: {
                id: true,
                winnerId: true,
                itemId: true,
            },
        });

        if (!auction) {
            return [];
        }

        // ดึง bids
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

        // ถ้าไม่มี winner ให้ return bids ปกติ
        if (!auction.winnerId) {
            return bids.map((bid: any) => this.mapToBidData(bid));
        }

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
        let statusAuction: 'WAITING_TO_PAID' | 'PAID' | 'EXPIRED_PAID' | 'CANCELED_PAID' | undefined;
        let paymentExpireAt: Date | null = null;

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

        // Map bids และแสดง status เฉพาะผู้ชนะ
        return bids.map((bid: any) => {
            const isWinner = bid.userId === auction.winnerId;
            return this.mapToBidData(
                bid,
                isWinner ? statusAuction : undefined,
                isWinner ? paymentExpireAt : null
            );
        });
    }

    /**
     * Find a bid by ID
     */
    async findBidById(bidId: string): Promise<BidData | null> {
        const bid = await this.prisma.bid.findUnique({
            where: { id: bidId },
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

        return bid ? this.mapToBidData(bid) : null;
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
                chargeId: data.chargeId,
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
     * Delete a bid
     */
    async deleteBid(bidId: string): Promise<void> {
        await this.prisma.bid.delete({
            where: { id: bidId },
        });
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
    private mapToBidData(
        bid: any,
        statusAuction?: 'WAITING_TO_PAID' | 'PAID' | 'EXPIRED_PAID' | 'CANCELED_PAID',
        paymentExpireAt?: Date | null
    ): BidData {
        return {
            id: bid.id,
            auctionId: bid.auctionId,
            userId: bid.userId,
            amount: bid.amount,
            bidAt: bid.bidAt,
            chargeId: bid.chargeId,
            user: bid.user ? {
                id: bid.user.id,
                profile: bid.user.profile ? {
                    firstName: bid.user.profile.firstName,
                    lastName: bid.user.profile.lastName,
                    avatarUrl: bid.user.profile.avatarUrl,
                } : undefined,
            } : undefined,
            statusAuction,
            paymentExpireAt: paymentExpireAt ?? null,
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
