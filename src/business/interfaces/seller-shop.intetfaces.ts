import { Decimal } from "@prisma/client/runtime/library";
import {
  ItemType,
  SellType,
} from "../../../generated/prisma";


export interface SearchItemWithImagesResult extends SearchItemResult {
    imageList: {
      id: string;
      targetId: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
    auction: (SearchItemResult["auction"] & { hasUserBid?: boolean }) | null;

    
  }
  
 
 
 
 
  export interface SearchItemResult {
    id: string;
    nameTh: string;
    nameEn: string;
    itemType: ItemType;
    sellType: SellType;
    descriptionTh: string;
    descriptionEn: string;
    shippingDuration: number;
    paymentStatus: string;
    paymentExpireDateTime: string;
    satisfyCount?: number;
    images: {
      imageUrl: string;
    }[];
    brand: {
      id: string;
      nameTh: string;
      nameEn: string;
    } | null;
    itemVariants: {
      id: string;
      sku: string;
      color?: string | null;
      stock: number;
      conditionDescription: string | null;
      defectNotes: string | null;
      includedItems: string | null;
      price: Decimal;

      sizes: {
        value: string;
        variantId: string;
        sizeUnitId: string;
        sortOrder: number;
        sizeUnit: {
          name: string;
        };
      }[];
    }[];
    seller: {
      id: string;
      profile: {
        avatarUrl?: string | null;
        firstName?: string;
        lastName?: string;
      } | null;
    };
    auction?: {
      id: string;
      startPrice: Decimal;
      endPrice?: Decimal | null;
      startAt: Date;
      endAt: Date;
      isActive: boolean;
      bids: {
        id: string;
        amount: Decimal;
      }[];
    } | null;
    satisfy: {
      id: string;
      status: string;
      shippingCost: Decimal;
      createdAt: Date;
    }[];

  }

  // Wrapper result including items and counts by status
  export interface SearchItemsWithCounts {
    items: SearchItemWithImagesResult[];
    countAll: number;
    countActive: number;
    countInactive: number;
    countDraft: number;
  }


  export interface SearchItemParam {
    userId: string,
    keyword?: string,
    categoryId?: string[] ,
    sellType?: string[],
    itemType?: string[],
    minPrice?: number,
    maxPrice?: number,
    page?: number,
    take?: number,
    sortBy?: "createdAt" | "price" | "updatedAt",
    sortOrder?: "asc" | "desc",
    status?: string,
    auctionStatus?: string,
    satisfyStatus?: string,
    itemId?: string
  }



export interface ISellerShopRepository {
    findItemsBySellerId(
      userId: string,
      keyword?: string,
      categoryId?: string[] ,
      sellType?: string[],
      itemType?: string[],
      minPrice?: number,
      maxPrice?: number,
      page?: number,
      take?: number,
      sortBy?: "createdAt" | "price" | "updatedAt",
      sortOrder?: "asc" | "desc",
      status?: string,
      auctionStatus?: string,
      satisfyStatus?: string,
      itemId?: string
    ): Promise<SearchItemsWithCounts>;
}

export interface ISellerShopService {
    getItemsBySellerId(
      userId: string,
      keyword?: string ,
      categoryId?: string[],
      sellType?: string[],
      itemType?: string[],
      minPrice?: number,
      maxPrice?: number,
      page?: number,
      take?: number,
      sortBy?: "createdAt" | "price" | "updatedAt",
      sortOrder?: "asc" | "desc",
      status?: string,
      auctionStatus?: string,
      satisfyStatus?: string,
      itemId?: string
    ): Promise<SearchItemsWithCounts>;
}



