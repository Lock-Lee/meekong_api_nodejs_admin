import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { AuctionParticipantStatus } from "../../../generated/prisma";
import {
    IAuctionParticipantService,
    IAuctionParticipantRepository,
    AuctionParticipantData,
    CreateAuctionParticipantRequest,
    UpdateAuctionParticipantRequest
} from "../interfaces/auction-participant.interfaces";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class AuctionParticipantService implements IAuctionParticipantService {
    constructor(
        @inject(TYPES.AuctionParticipantRepository) private participantRepository: IAuctionParticipantRepository
    ) { }

    async getParticipantsByAuction(auctionId: string): Promise<AuctionParticipantData[]> {
        Logger.info("Fetching auction participants", { auctionId });

        const participants = await this.participantRepository.findParticipantsByAuction(auctionId);

        Logger.info("Auction participants retrieved", {
            auctionId,
            participantCount: participants.length
        });

        return participants;
    }

    async createParticipant(request: CreateAuctionParticipantRequest): Promise<AuctionParticipantData> {
        const { auctionId, userId, depositAmount } = request;

        Logger.info("Creating auction participant", { auctionId, userId, depositAmount });

        const participantData = {
            auctionId,
            userId,
            depositAmount,
            status: AuctionParticipantStatus.PENDING, // Default status
        };

        const participant = await this.participantRepository.createParticipant(participantData);

        Logger.info("Auction participant created", {
            participantId: participant.id,
            auctionId,
            userId
        });

        return participant;
    }

    async updateParticipant(id: string, request: UpdateAuctionParticipantRequest): Promise<AuctionParticipantData> {
        Logger.info("Updating auction participant", { participantId: id, status: request.status });

        // Check if participant exists
        const existingParticipant = await this.participantRepository.findParticipantById(id);
        if (!existingParticipant) {
            throw new BusinessError("Auction participant not found", "NOT_FOUND");
        }

        const updatedParticipant = await this.participantRepository.updateParticipant(id, {
            status: request.status,
        });

        Logger.info("Auction participant updated", {
            participantId: id,
            newStatus: request.status
        });

        return updatedParticipant;
    }
}
