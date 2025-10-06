import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IAuctionParticipantRepository,
    AuctionParticipantData
} from "../../business/interfaces/auction-participant.interfaces";

@injectable()
export class AuctionParticipantRepository implements IAuctionParticipantRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    async findParticipantsByAuction(auctionId: string): Promise<AuctionParticipantData[]> {
        const participants = await this.prisma.auctionParticipant.findMany({
            where: { auctionId },
            orderBy: { createdAt: "desc" },
        });

        return participants.map((p: any) => this.mapToParticipantData(p));
    }

    async findParticipantById(id: string): Promise<AuctionParticipantData | null> {
        const participant = await this.prisma.auctionParticipant.findUnique({
            where: { id },
        });

        return participant ? this.mapToParticipantData(participant) : null;
    }

    async createParticipant(data: Omit<AuctionParticipantData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionParticipantData> {
        const participant = await this.prisma.auctionParticipant.create({
            data: {
                auctionId: data.auctionId,
                userId: data.userId,
                depositAmount: data.depositAmount,
                status: data.status,
            },
        });

        return this.mapToParticipantData(participant);
    }

    async updateParticipant(id: string, data: Partial<AuctionParticipantData>): Promise<AuctionParticipantData> {
        const updateData: any = {};
        if (data.status !== undefined) updateData.status = data.status;
        if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount;

        const participant = await this.prisma.auctionParticipant.update({
            where: { id },
            data: updateData,
        });

        return this.mapToParticipantData(participant);
    }

    private mapToParticipantData(participant: any): AuctionParticipantData {
        return {
            id: participant.id,
            auctionId: participant.auctionId,
            userId: participant.userId,
            depositAmount: participant.depositAmount,
            status: participant.status,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt,
        };
    }
}
