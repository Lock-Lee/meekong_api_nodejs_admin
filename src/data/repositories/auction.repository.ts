import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import { IAuctionRepository, AuctionData } from "../../business/interfaces/auction.interfaces";

@injectable()
export class AuctionRepository implements IAuctionRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: any) { }

    async findAuctions(page: number, pageSize: number, status?: Status): Promise<{ auctions: AuctionData[]; total: number }> {
        const skip = (page - 1) * pageSize;
        const where: any = {};
        if (status) where.status = status;

        const [auctions, total] = await this.prisma.$transaction([
            this.prisma.auction.findMany({
                take: pageSize,
                skip,
                where,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.auction.count({ where }),
        ]);

        return {
            auctions: auctions.map((a: any) => this.mapToAuctionData(a)),
            total,
        };
    }

    async findAuctionById(id: string): Promise<AuctionData | null> {
        const auction = await this.prisma.auction.findUnique({ where: { id } });
        return auction ? this.mapToAuctionData(auction) : null;
    }

    async createAuction(data: Omit<AuctionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionData> {
        const { itemId, variantId, createdById, ...rest } = data;
        

        // Precondition checks to avoid relation violations
        // 1) Ensure Item exists
        const item = await this.prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
        if (!item) {
            throw new Error(`Item not found for id=${itemId}`);
        }

        // 2) Ensure Variant exists and belongs to the same item
        const variant = await this.prisma.itemVariant.findUnique({ where: { id: variantId }, select: { id: true, itemId: true } });
        if (!variant) {
            throw new Error(`ItemVariant not found for id=${variantId}`);
        }
        if (variant.itemId !== itemId) {
            throw new Error(`Variant ${variantId} does not belong to Item ${itemId}`);
        }

        // 3) Ensure there is no existing auction for this item (one auction per item)
        const existing = await this.prisma.auction.findUnique({ where: { itemId } });
        if (existing) {
            throw new Error(`Auction already exists for itemId=${itemId}`);
        }



        const auction = await this.prisma.auction.create({
            data: {
                item: { connect: { id: itemId } },
                variant: { connect: { id: variantId } },
                createdBy: { connect: { id: createdById } },
                buyNowPrice: rest.buyNowPrice || null,
                startPrice: rest.startPrice,
                reservePrice: rest.reservePrice,
                startAt: rest.startAt,
                endAt: rest.endAt,
                // extendDurationAfterLastBid is not in schema currently
                isActive: rest.isActive,
            }
        });

        
        const itemByItemId = await this.prisma.item.findUnique({ where: { id: itemId } });

        // Ensure we compare against the enum and use the correct field name 'status'
        if (itemByItemId?.status === Status.DRAFT) {
            await this.prisma.item.update({ where: { id: itemId }, data: { status: Status.ACTIVE } });
        }
        
        return this.mapToAuctionData(auction);
    }

    async updateAuction(id: string, data: Partial<AuctionData>): Promise<AuctionData> {
        const auction = await this.prisma.auction.update({ where: { id }, data });
        return this.mapToAuctionData(auction);
    }

    private mapToAuctionData(auction: any): AuctionData {
        return {
            id: auction.id,
            itemId: auction.itemId,
            variantId: auction.variantId,
            startPrice: auction.startPrice,
            currentBid: auction.currentBid,
            highestBidderId: auction.highestBidderId,
            reservePrice: auction.reservePrice,
            startAt: auction.startAt,
            endAt: auction.endAt,
            extendDurationAfterLastBid: auction.extendDurationAfterLastBid,
            buyNowPrice: auction.buyNowPrice,
            isActive: auction.isActive,
            // status: Status.ACTIVE,
            createdAt: auction.createdAt,
            updatedAt: auction.updatedAt,
            createdById: auction.createdById,
        };
    }
}