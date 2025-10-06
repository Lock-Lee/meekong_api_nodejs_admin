import { UploadedFile } from "express-fileupload";
import {
  ItemType,
  SellType,
  ProductCondition,
  Status, // Import Status enum
} from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Define Item types for better type safety
export interface ItemDetails {
  id: string;
  nameTh?: string;
  nameEn?: string;
  descriptionTh: string;
  descriptionEn: string;
  itemType: ItemType;
  sellType: SellType;
  shippingDuration?: number;
  status?: Status;
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

export interface itemVariantsUpdate {
  variantId: string;
  price?: number;
  stockQuantity?: number;
}
export interface ItemVariantUpdate {
  itemId: string;
  userId: string;
  nameTh?: string;
  nameEn?: string;
  itemVariants?:itemVariantsUpdate[],
  itemAuction?: itemAuctionUpdate[],
}

export interface UpdateItemVariantRequest {
  nameTh?: string;
  nameEn?: string;
  itemVariants?:itemVariantsUpdate[],
}



export interface itemVariantAuctionUpdate {
  variantId?: string;
  stockQuantity?: number;
}

export interface itemVariantUpdate {
  variantId: string;
  stockQuantity?: number;
}

export interface itemAuctionUpdate {
    auctionId: string;
    startPrice?: number;
    buyNowPrice?: number;
    startAt?: string;
    endAt?: string;
}
export interface UpdateVariantAuctionItemRequest {
  nameTh?: string;
  nameEn?: string;
  itemVariants?: itemVariantUpdate[],
  itemAuction?: itemAuctionUpdate[],
}

// Service Interfaces
export interface IItemService {
  createItem(data: CreateItemRequest, userId: string): Promise<ItemDetails>;
  searchItems(request: SearchItemsRequest): Promise<SearchResult>;
  getItemDetails(id: string, userId?: string): Promise<ItemDetails>;
  updateItem(
    id: string,
    data: Partial<CreateItemRequest>,
    userId: string
  ): Promise<ItemDetails>;
  updateItemVariant(
    itemId: string,
    data: UpdateItemVariantRequest,
    userId: string
  ): Promise<ItemVariantUpdate>;
  updateVariantAuctionItem(
    itemId: string,
    data: UpdateVariantAuctionItemRequest,
    userId: string
  ): Promise<ItemVariantUpdate>;
  deleteItem(id: string, userId: string ,status?: string): Promise<void>;
  getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
}

export interface ITagService {
  processItemTags(itemId: string, tagNames: string[]): Promise<void>;
  updateItemTags(itemId: string, newTagNames: string[]): Promise<void>;
  getItemTags(itemId: string): Promise<string[]>;
  getPopularTags(
    limit?: number
  ): Promise<import("./tag.interfaces").PopularTagResult[]>;
  searchTags(query: string, limit?: number): Promise<string[]>;
  cleanupUnusedTags(): Promise<void>;
}

// Repository Interfaces
export interface IItemRepository {
  create(data: CreateItemData): Promise<ItemDetails>;
  findById(id: string, userId?: string): Promise<any>;
  search(
    filters: SearchFilters
  ): Promise<{ items: SearchItemWithImagesResult[]; total: number }>;
  update(id: string, data: Partial<CreateItemData>): Promise<ItemDetails>;
  updateVariant(
    itemId: string,
    data: UpdateItemVariantRequest,
    userId: string
  ): Promise<ItemVariantUpdate>;
  updateVariantAuctionItem(
    itemId: string,
    data: UpdateVariantAuctionItemRequest,
    userId: string
  ): Promise<ItemVariantUpdate>;
  delete(id: string, userId: string, status?: string): Promise<void>;
  getSearchSuggestions(query: string, limit?: number): Promise<string[]>;
}

// Data Transfer Objects
export interface CreateItemRequest {
  brandId: string;
  categoryId: string;
  nameTh?: string;
  nameEn?: string;
  descriptionTh: string;
  descriptionEn: string;
  itemType: ItemType;
  sellType: SellType;
  shippingDuration?: number;
  itemVariants?: CreateItemVariant[];
  tags?: string[];
  images?: UploadedFile[];
  status?: Status;
}

// Images attached to a specific variant when creating an item

export interface CreateItemVariant {
  variantName: string;
  price: number;
  comparePrice?: number;
  stockQuantity: number;
  sku?: string;
  color?: string;
  conditionDescription?: ProductCondition;
  defectNotes?: string;
  includedItems?: string;
  // Optional images for this variant
  sizes?: CreateItemVariantSize[];
  images?: UploadedFile[];
}

export interface CreateItemVariantSize {
  sizeUnitId: string;
  value: string;
  sortOrder?: number;
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
  status?: Status;
}

export interface CreateItemData {
  brandId: string;
  categoryId: string;
  nameTh?: string;
  nameEn?: string;
  descriptionTh: string;
  descriptionEn: string;
  itemType: ItemType;
  sellType: SellType;
  shippingDuration?: number;
  sellerId: string;
  itemVariants?: CreateItemVariant[];
  status?: Status; // Add optional status field
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
