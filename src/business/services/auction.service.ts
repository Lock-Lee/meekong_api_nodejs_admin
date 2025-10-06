import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import {
    IAuctionService,
    IAuctionRepository,
    AuctionData,
    CreateAuctionRequest,
    AuctionListResult
} from "../interfaces/auction.interfaces";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class AuctionService implements IAuctionService {
    constructor(@inject(TYPES.AuctionRepository) private auctionRepository: IAuctionRepository) { }

    async getAuctions(page: number, status?: Status): Promise<AuctionListResult> {
        const pageSize = 10;
        Logger.info("Fetching auctions", { page, status });

        const { auctions, total } = await this.auctionRepository.findAuctions(page, pageSize, status);

        return {
            items: auctions,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getAuctionById(id: string): Promise<AuctionData | null> {
        Logger.info("Fetching auction by ID", { auctionId: id });
        return await this.auctionRepository.findAuctionById(id);
    }

    async createAuction(request: CreateAuctionRequest): Promise<AuctionData> {
        Logger.info("Creating auction", request);
        try {


            const auctionData = {
                itemId: request.itemId,
                variantId: request.variantId,
                startPrice: request.startPrice,
                reservePrice: request.reservePrice,
                startAt: new Date(request.startAt),
                endAt: new Date(request.endAt),
                buyNowPrice: request.buyNowPrice,
                // extendDurationAfterLastBid: request.extendDurationAfterLastBid,
                isActive: true,
                status: Status.ACTIVE,
                createdById: request.createdById,
            };

            const auction = await this.auctionRepository.createAuction(auctionData);
            Logger.info("Auction created", { auctionId: auction.id });

            return auction;
        } catch (error) {
            console.log('Auction created', error);
            throw error;
        }
    }


}
