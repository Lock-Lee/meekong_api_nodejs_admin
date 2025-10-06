import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerFavoriteService } from "../../business/interfaces/buyer-favorite.interfaces";

@injectable()
export class BuyerFavoriteController {
  private buyerFavoriteService: IBuyerFavoriteService;

  constructor() {
    this.buyerFavoriteService = container.get<IBuyerFavoriteService>(
      TYPES.BuyerFavoriteService
    );
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all buyer favorites", { requestId: req.id });
      const buyerFavorites =
        await this.buyerFavoriteService.getAllBuyerFavorites(
          req.query.userId as string
        );

      Logger.info("Buyer favorites retrieved successfully", {
        buyerFavoriteCount: buyerFavorites.length,
        requestId: req.id,
      });

      return Send.success(
        res,
        buyerFavorites,
        "Buyer favorites fetched successfully."
      );
    } catch (error) {
      Logger.error("Failed to fetch buyer favorites", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, itemId, variantId } = req.body;
      Logger.info("Processing buyer favorite creation/deletion", {
        requestId: req.id,
        userId,
        itemId,
        variantId,
      });

      const existingFavorite =
        await this.buyerFavoriteService.findBuyerFavoriteByCriteria(
          userId,
          itemId,
          variantId
        );

      if (existingFavorite) {
        await this.buyerFavoriteService.deleteBuyerFavorite(
          existingFavorite.id
        );
        Logger.info("Existing buyer favorite deleted successfully", {
          buyerFavoriteId: existingFavorite.id,
          requestId: req.id,
        });
        return Send.success(
          res,
          { id: existingFavorite.id },
          "Existing buyer favorite deleted successfully."
        );
      } else {
        const buyerFavorite =
          await this.buyerFavoriteService.createBuyerFavorite(req.body);
        Logger.info("Buyer favorite created successfully", {
          buyerFavoriteId: buyerFavorite.id,
          requestId: req.id,
        });
        return Send.success(
          res,
          buyerFavorite,
          "Buyer favorite created successfully."
        );
      }
    } catch (error) {
      Logger.error("Failed to process buyer favorite", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const favoriteId = req.params.id;
      Logger.info("Deleting buyer favorite", {
        buyerFavoriteId: favoriteId,
        requestId: req.id,
      });

      await this.buyerFavoriteService.deleteBuyerFavorite(favoriteId);

      Logger.info("Buyer favorite deleted successfully", {
        buyerFavoriteId: favoriteId,
        requestId: req.id,
      });

      return Send.success(
        res,
        { id: favoriteId },
        "Buyer favorite deleted successfully."
      );
    } catch (error) {
      Logger.error("Failed to delete buyer favorite", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }
}
