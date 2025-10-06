import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
  BuyerFavoriteData,
  CreateBuyerFavoriteData,
  IBuyerFavoriteRepository,
  IBuyerFavoriteService,
} from "../interfaces/buyer-favorite.interfaces";
import { Logger } from "@utils/logger";

@injectable()
export class BuyerFavoriteService implements IBuyerFavoriteService {
  constructor(
    @inject(TYPES.BuyerFavoriteRepository)
    private buyerFavoriteRepository: IBuyerFavoriteRepository
  ) {}

  deleteBuyerFavorite(id: string): Promise<void> {
    Logger.info("Deleting buyer favorite", { id });
    return this.buyerFavoriteRepository.deleteBuyerFavorite(id);
  }

  async getAllBuyerFavorites(buyerId: string): Promise<BuyerFavoriteData[]> {
    Logger.info("Fetching buyer favorites", { buyerId });
    return this.buyerFavoriteRepository.findBuyerFavoritesByBuyerId(buyerId);
  }

  async createBuyerFavorite(
    data: CreateBuyerFavoriteData
  ): Promise<BuyerFavoriteData> {
    Logger.info("Creating buyer favorite", { data });
    return this.buyerFavoriteRepository.createBuyerFavorite(data);
  }

  async findBuyerFavoriteByCriteria(
    userId: string,
    itemId: string,
    variantId?: string
  ): Promise<BuyerFavoriteData | null> {
    Logger.info("Finding buyer favorite by criteria", {
      userId,
      itemId,
      variantId,
    });
    return this.buyerFavoriteRepository.findBuyerFavoriteByCriteria(
      userId,
      itemId,
      variantId
    );
  }
}
