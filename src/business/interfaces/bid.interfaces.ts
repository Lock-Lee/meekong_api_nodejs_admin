export interface BidData {
    id: string;
    auctionId: string;
    userId: string;
    amount: number;
    bidAt: Date;
    user?: {
        id: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            avatarUrl?: string;
        };
    };
}

export interface AuctionData {
    id: string;
    isActive: boolean;
    endAt: Date;
    currentBid?: number;
    startPrice: number;
    highestBidderId?: string;
    extendDurationAfterLastBid?: number;
}

export interface CreateBidRequest {
    auctionId: string;
    userId: string;
    amount: number;
}

export interface CreateBidResult {
    newBid: BidData;
    updatedAuction: AuctionData;
}

export interface BidListResult {
    bids: BidData[];
    total: number;
}

export interface BidRankingItem {
    rowNumber: number;
    id: string;
    amount: number;
    bidAt: Date;
    user: {
        id: string;
        firstName?: string;
        lastName?: string;
        imageUser?: string;
    };
}

/**
 * Repository interface for bid-related data operations
 */
export interface IBidRepository {
    // Bid operations
    findBidsByAuction(auctionId: string): Promise<BidData[]>;
    findBidsByAuctionOrderedByAmount(auctionId: string): Promise<BidData[]>;
    createBid(data: Omit<BidData, 'id' | 'bidAt' | 'user'>): Promise<BidData>;

    // Auction operations
    findAuctionById(auctionId: string): Promise<AuctionData | null>;
    updateAuction(auctionId: string, data: Partial<AuctionData>): Promise<AuctionData>;

    // Transaction support
    executeTransaction<T>(callback: (repository: IBidRepository) => Promise<T>): Promise<T>;
}

/**
 * Service interface for bid business logic
 */
export interface IBidService {
    // Bid operations
    getBidsByAuction(auctionId: string): Promise<BidData[]>;
    createBid(request: CreateBidRequest): Promise<CreateBidResult>;
    getBidRankingByAuction(auctionId: string): Promise<BidRankingItem[]>;

    // Business logic
    validateBidAmount(auctionId: string, amount: number): Promise<void>;
    isAuctionActive(auctionId: string): Promise<boolean>;
}
