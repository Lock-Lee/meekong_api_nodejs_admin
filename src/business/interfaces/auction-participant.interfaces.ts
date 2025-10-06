import { AuctionParticipantStatus } from "../../../generated/prisma";

export interface AuctionParticipantData {
    id: string;
    auctionId: string;
    userId: string;
    depositAmount: number;
    status: AuctionParticipantStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAuctionParticipantRequest {
    auctionId: string;
    userId: string;
    depositAmount: number;
}

export interface UpdateAuctionParticipantRequest {
    status: AuctionParticipantStatus;
}

/**
 * Repository interface for auction participant data operations
 */
export interface IAuctionParticipantRepository {
    findParticipantsByAuction(auctionId: string): Promise<AuctionParticipantData[]>;
    findParticipantById(id: string): Promise<AuctionParticipantData | null>;
    createParticipant(data: Omit<AuctionParticipantData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionParticipantData>;
    updateParticipant(id: string, data: Partial<AuctionParticipantData>): Promise<AuctionParticipantData>;
}

/**
 * Service interface for auction participant business logic
 */
export interface IAuctionParticipantService {
    getParticipantsByAuction(auctionId: string): Promise<AuctionParticipantData[]>;
    createParticipant(request: CreateAuctionParticipantRequest): Promise<AuctionParticipantData>;
    updateParticipant(id: string, request: UpdateAuctionParticipantRequest): Promise<AuctionParticipantData>;
}
