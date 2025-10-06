import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IAuctionService } from "../../business/interfaces/auction.interfaces";
import { Status } from "../../../generated/prisma";
import { z } from "zod";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

const listAuctionsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  status: z.nativeEnum(Status).optional(),
});

const createAuctionBodySchema = z.object({
  itemId: z.string().uuid(),
  variantId: z.string().uuid(),
  startPrice: z.number().positive(),
  reservePrice: z.number().positive().optional(),
  startAt: z.string().datetime(),
  buyNowPrice: z.number().positive().optional(),
  endAt: z.string().datetime(),
  extendDurationAfterLastBid: z.number().int().positive().optional(),
  createdById: z.string().uuid(),
});

@injectable()
export class AuctionController {
  constructor(
    @inject(TYPES.AuctionService) private readonly auctionService: IAuctionService
  ) { }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const validation = listAuctionsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(res, validation.error.issues, "Invalid query parameters.");
      }

      const { page, status } = validation.data;
      const result = await this.auctionService.getAuctions(page, status);

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to list auctions", { error: (error as Error).message });
      return Send.error(res, null, "Failed to retrieve auctions.");
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auction = await this.auctionService.getAuctionById(id);

      if (!auction) {
        return Send.error(res, null, "Auction not found.");
      }

      return Send.success(res, auction);
    } catch (error) {
      Logger.error("Failed to get auction", { error: (error as Error).message });
      return Send.error(res, null, "Failed to retrieve auction.");
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = createAuctionBodySchema.safeParse(req.body);
      if (!validation.success) {
        return Send.error(res, validation.error.errors, "Invalid request body.");
      }

      const auction = await this.auctionService.createAuction(validation.data);
      return Send.success(res, auction, "Auction created successfully.");
    } catch (error) {
      Logger.error("Failed to create auction", { error: (error as Error).message });
      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }
      return Send.error(res, null, "Failed to create auction. " + error);
    }
  }
}

export default AuctionController;