export interface BuyerFavoriteData {
  id: string;
  userId: string;
  itemId: string;
  variantId?: string;
  createdAt: Date;
}

export interface CreateBuyerFavoriteData {
  userId: string;
  itemId: string;
  variantId?: string;
}

export interface IBuyerFavoriteRepository {
  findBuyerFavoritesByBuyerId(buyerId: string): Promise<BuyerFavoriteData[]>;
  createBuyerFavorite(
    data: CreateBuyerFavoriteData
  ): Promise<BuyerFavoriteData>;
  deleteBuyerFavorite(id: string): Promise<void>;
  findBuyerFavoriteByCriteria(
    userId: string,
    itemId: string,
    variantId?: string
  ): Promise<BuyerFavoriteData | null>;
}

export interface IBuyerFavoriteService {
  getAllBuyerFavorites(buyerId: string): Promise<BuyerFavoriteData[]>;
  createBuyerFavorite(
    data: CreateBuyerFavoriteData
  ): Promise<BuyerFavoriteData>;
  deleteBuyerFavorite(id: string): Promise<void>;
  findBuyerFavoriteByCriteria(
    userId: string,
    itemId: string,
    variantId?: string
  ): Promise<BuyerFavoriteData | null>;
}
