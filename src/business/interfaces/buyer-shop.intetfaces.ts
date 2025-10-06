
import { Decimal } from "@prisma/client/runtime/library";

import {
  ItemType,
  SellType,
  ProductCondition,
  reviewStatus
} from "../../../generated/prisma";

export interface ProfileData {
  userId: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  countFollowers: number;
  countPositiveReviews: number;

}

export interface ShopData {
  id: string;
  name: string;
  avatarUrl?: string;
  bannerUrl?: string;
  slug: string;
}

export interface UserData {
  id: string;
  email: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  profile?: ProfileData;
  Shop?: ShopData[];
}



export interface ItemDetails {
  id: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  descriptionEn: string;
  itemType: ItemType;
  sellType: SellType;
  shippingDuration?: number;
  seller: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  category: {
    id: string;
    nameTh: string;
    nameEn: string;
  };
  brand: {
    id: string;
    name: string;
  };
  itemVariants: ItemVariant[];
  images: ItemImage[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemVariant {
  id: string;
  variantName: string;
  price: number;
  comparePrice?: number;
  stockQuantity: number;
  sku?: string;
  color?: string;
  conditionDescription?: ProductCondition;
  defectNotes?: string;
  includedItems?: string;
  sizes?: ItemVariantSize[];
}

export interface ItemVariantSize {
  id: string;
  sizeUnitId: string;
  value: string;
  sortOrder?: number;
  sizeUnit: {
    id: string;
    name: string;
    unitSymbol?: string;
  };
}

export interface ItemImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
}

export interface SearchResult {
  items: SearchItemWithImagesResult[];
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}


export interface BuyerReviewData {
  id: string;
  shopId: string;
  userId: string;
  rating?: number;
  comment?: string;
  images?: string[];
  status: reviewStatus;
  createdAt?: Date;
  user?: {
    id: string;
    profile: {
      avatarUrl: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface FindBuyerReviewParams {
  userId?: string;
  shopId?: string;
  take?: number;
  skip?: number;
}

export interface IBuyerShopRepository {
  findSellerProfileById(userId: string): Promise<UserData | null>;
  findItemsBySellerId(
    userId: string,
    keyword?: string,
    categoryId?: string[],
    sellType?: string[],
    itemType?: string[],
    minPrice?: number,
    maxPrice?: number,
    page?: number,
    take?: number,
    sortBy?: "createdAt" | "priceMin" | "priceMax",
    sortOrder?: "asc" | "desc"
  ): Promise<SearchItemWithImagesResult[]>;
  findCategoryBySellerId(userId: string): Promise<{ categoryId: string; categoryName: string; count: number }[]>;
  findBuyerReviewBySellerId(userId: string, shopId: string): Promise<BuyerReviewData[]>;
}

export interface IBuyerShopService {
  getSellerProfileById(userId: string): Promise<UserData | null>;
  getItemsBySellerId(
    userId: string,
    keyword?: string,
    categoryId?: string[],
    sellType?: string[],
    itemType?: string[],
    minPrice?: number,
    maxPrice?: number,
    page?: number,
    take?: number,
    sortBy?: "createdAt" | "priceMin" | "priceMax",
    sortOrder?: "asc" | "desc"
  ): Promise<SearchItemWithImagesResult[]>;
  getCategoryBySellerId(userId: string): Promise<{ categoryId: string; categoryName: string; count: number }[]>;
  getAllBuyerReview(userId: string, shopId: string): Promise<BuyerReviewData[]>;
}






export interface SearchItemsRequest {
  keyword?: string;
  categoryId?: string[];
  brandId?: string[];
  minPrice?: number;
  maxPrice?: number;
  itemType?: ItemType;
  sellType?: SellType[];
  userId?: string;
  page?: number;
}



export interface SearchFilters {
  keyword?: string;
  categoryId?: string[];
  brandId?: string[];
  minPrice?: number;
  maxPrice?: number;
  itemType?: ItemType;
  sellType?: SellType[];
  userId?: string;
  page: number;
  take: number;
}

// Type for findById result that matches the actual Prisma select
export interface ItemDetailsWithRelations {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  descriptionEn: string;
  itemType: ItemType;
  sellType: SellType;
  shippingDuration?: number | null;
  status: string;
  createdAt: Date;
  brand: {
    id: string;
    nameTh: string;
    nameEn: string;
  } | null;
  category: {
    id: string;
    nameTh: string;
    nameEn: string;
  };
  itemVariants: {
    id: string;
    price: Decimal;
    color?: string | null;
    sizes: {
      value: string;
      sizeUnit: {
        name: string;
      };
    }[];
  }[];
  images: {
    id: string;
    imageUrl: string;
    order: number;
  }[];
  seller: {
    id: string;
    profile: {
      avatarUrl?: string | null;
      firstName?: string;
      lastName?: string;
    } | null;
  };
  auction?:
  | {
    id: string;
    startPrice: Decimal;
    endPrice?: Decimal | null;
    startAt: Date;
    endAt: Date;
    isActive: boolean;
    buyNowPrice?: Decimal | null;
    bids: {
      id: string;
      amount: Decimal;
    }[];
  }
  | false
  | null;
}

// Type for search result items
export interface SearchItemResult {
  id: string;
  nameTh: string;
  nameEn: string;
  itemType: ItemType;
  sellType: SellType;
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
    price: Decimal;
    color?: string | null;
    stock: number;
    sizes: {
      value: string;
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
}

export interface SearchItemWithImagesResult extends SearchItemResult {
  imageList: {
    id: string;
    targetId: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];
  auction: (SearchItemResult["auction"] & { hasUserBid?: boolean }) | null;
}
