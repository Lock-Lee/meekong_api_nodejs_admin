import { Status } from "../../../generated/prisma";

export interface AuctionData {
    id: string;
    itemId: string;
    variantId: string;
    startPrice: number;
    currentBid?: number;
    highestBidderId?: string;
    buyNowPrice?: number;
    reservePrice?: number;
    startAt: Date;
    endAt: Date;
    extendDurationAfterLastBid?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdById: string;
}

export interface CreateAuctionRequest {
    itemId: string;
    variantId: string;
    startPrice: number;
    reservePrice?: number;
    startAt: string;
    endAt: string;
    extendDurationAfterLastBid?: number;
    createdById: string;
    buyNowPrice?: number;
}

export interface AuctionListResult {
    items: AuctionData[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface IAuctionRepository {
    findAuctions(page: number, pageSize: number, status?: Status): Promise<{ auctions: AuctionData[]; total: number }>;
    findAuctionById(id: string): Promise<AuctionData | null>;
    createAuction(data: Omit<AuctionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionData>;
    updateAuction(id: string, data: Partial<AuctionData>): Promise<AuctionData>;
}

export interface IAuctionService {
    getAuctions(page: number, status?: Status): Promise<AuctionListResult>;
    getAuctionById(id: string): Promise<AuctionData | null>;
    createAuction(request: CreateAuctionRequest): Promise<AuctionData>;
}
