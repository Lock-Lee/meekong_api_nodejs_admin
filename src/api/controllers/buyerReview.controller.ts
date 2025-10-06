import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerReviewService } from "../../business/interfaces/buyer-review.interfaces";
import { UploadedFile } from "express-fileupload";


@injectable()
export class BuyerReviewController {
  private buyerReviewService: IBuyerReviewService;
  constructor() {
    this.buyerReviewService = container.get<IBuyerReviewService>(TYPES.BuyerReviewService);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all buyer reviews", { requestId: req.id });

      const buyerReviews = await this.buyerReviewService.getAllBuyerReview(req.query.userId as string, req.query.shopId as string);

      Logger.info("Buyer reviews retrieved successfully", {
        buyerReviewCount: buyerReviews.length,
        requestId: req.id
      });

      return Send.success(res, buyerReviews, "Buyer reviews fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch buyer reviews", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching buyer review by ID", { requestId: req.id });

      const buyerReview = await this.buyerReviewService.getBuyerReviewById(req.params.id);

      Logger.info("Buyer review retrieved successfully", {
        buyerReviewId: buyerReview.id,
        requestId: req.id
      });

      return Send.success(res, buyerReview, "Buyer review fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch buyer review by ID", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
  async create(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating buyer review", { requestId: req.id });
      const images = req.files?.images as UploadedFile[] | UploadedFile | undefined;
      const imageArray = images ? (Array.isArray(images) ? images : [images]) : [];

      const buyerReviewData = {
        ...req.body,
        images: imageArray
      };
      const buyerReview = await this.buyerReviewService.createBuyerReview(buyerReviewData);

      Logger.info("Buyer review created successfully", {
        buyerReviewId: buyerReview.id,
        requestId: req.id
      });

      return Send.success(res, buyerReview, "Buyer review created successfully.");
    } catch (error) {
      Logger.error("Failed to create buyer review", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Updating buyer review", { requestId: req.id });

      const buyerReview = await this.buyerReviewService.updateBuyerReview(req.params.id, req.body);

      Logger.info("Buyer review updated successfully", {
        buyerReviewId: buyerReview.id,
        requestId: req.id
      });

      return Send.success(res, buyerReview, "Buyer review updated successfully.");
    } catch (error) {
      Logger.error("Failed to update buyer review", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Deleting buyer review", { requestId: req.id });

      await this.buyerReviewService.deleteBuyerReview(req.params.id);

      Logger.info("Buyer review deleted successfully", {
        requestId: req.id
      });

      return Send.success(res, { id: req.params.id }, "Buyer review deleted successfully.");
    } catch (error) {
      Logger.error("Failed to delete buyer review", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

}