import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IBidService } from "../../business/interfaces/bid.interfaces";
import bidSchema from "@schemas/bid.schemas";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BidController {
  constructor(
    @inject(TYPES.BidService) private readonly bidService: IBidService
  ) { }

  /**
   * List all bids for a specific auction
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const validation = bidSchema.listBidsQuery.safeParse(req.query);
      if (!validation.success) {
        Logger.warn("Invalid query parameters for bid list", {
          errors: validation.error.issues,
          requestId: req.id
        });
        return Send.error(res, validation.error.issues, "Invalid query parameters.");
      }

      const { auctionId } = validation.data;

      Logger.info("Listing bids for auction", { auctionId, requestId: req.id });

      const bids = await this.bidService.getBidsByAuction(auctionId);

      Logger.info("Bids retrieved successfully", {
        auctionId,
        bidCount: bids.length,
        requestId: req.id
      });

      return Send.success(res, bids);
    } catch (error) {
      Logger.error("Failed to list bids", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve bids.");
    }
  }

  /**
   * Create a new bid
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const bodyValidation = bidSchema.createBid.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for bid creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const bidData = bodyValidation.data;

      Logger.info("Creating new bid", {
        auctionId: bidData.auctionId,
        userId: bidData.userId,
        amount: bidData.amount,
        requestId: req.id
      });

      const result = await this.bidService.createBid(bidData);

      Logger.info("Bid created successfully", {
        bidId: result.newBid.id,
        auctionId: bidData.auctionId,
        amount: bidData.amount,
        requestId: req.id
      });

      return Send.success(res, result, "Bid placed successfully.");
    } catch (error) {
      Logger.error("Failed to create bid", {
        error: (error as Error).message,
        auctionId: req.body?.auctionId,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, { message: error.message }, error.message, error.statusCode);
      }

      return Send.error(res, { message: (error as Error).message }, "An internal server error occurred.");
    }
  }

  /**
 * Get bid ranking for an auction (highest bids per user)
 */
  async getBidById(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = bidSchema.getBidByIdParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for bid ranking", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const { id: auctionId } = paramsValidation.data;

      Logger.info("Getting bid ranking for auction", { auctionId, requestId: req.id });

      const ranking = await this.bidService.getBidRankingByAuction(auctionId);

      if (!ranking || ranking.length === 0) {
        Logger.info("No bids found for auction", { auctionId, requestId: req.id });
        return Send.error(res, null, "Bid not found.");
      }

      Logger.info("Bid ranking retrieved successfully", {
        auctionId,
        rankingCount: ranking.length,
        requestId: req.id
      });

      return Send.success(res, ranking);
    } catch (error) {
      Logger.error("Failed to get bid ranking", {
        error: (error as Error).message,
        auctionId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve bid.");
    }
  }
}

export default BidController;