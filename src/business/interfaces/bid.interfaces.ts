export interface BidData {
    id: string;
    auctionId: string;
    userId: string;
    amount: number;
    bidAt: Date;
    chargeId?: string;  // Omise charge ID for payment
    user?: {
        id: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            avatarUrl?: string;
        };
    };
    // Auction payment status
    statusAuction?: 'WAITING_TO_PAID' | 'PAID' | 'EXPIRED_PAID' | 'CANCELED_PAID';
    paymentExpireAt?: Date | null;
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
    cardToken?: string;  // Card token for payment
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
    // Auction payment status
    statusAuction?: 'WAITING_TO_PAID' | 'PAID' | 'EXPIRED_PAID' | 'CANCELED_PAID';
    paymentExpireAt?: Date | null;
}

/**
 * Repository interface for bid-related data operations
 */
export interface IBidRepository {
    // Bid operations
    findBidsByAuction(auctionId: string): Promise<BidData[]>;
    findBidsByAuctionOrderedByAmount(auctionId: string): Promise<BidData[]>;
    findBidById(bidId: string): Promise<BidData | null>;
    createBid(data: Omit<BidData, 'id' | 'bidAt' | 'user'>): Promise<BidData>;
    deleteBid(bidId: string): Promise<void>;

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
    cancelBid(bidId: string, userId: string): Promise<void>;

    // Business logic
    validateBidAmount(auctionId: string, amount: number): Promise<void>;
    isAuctionActive(auctionId: string): Promise<boolean>;
}
