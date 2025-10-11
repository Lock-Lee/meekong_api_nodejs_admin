import { OfferStatus, OrderStatus } from "../../../generated/prisma";

export type SatisfyBuyerProfile = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
} | null;

export type SatisfyBuyer = {
  id: string;
  profile: SatisfyBuyerProfile;
};


export interface SatisfyDataAll {
  id: string;
  itemId: string;
  variantId?: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: number;
  amountBefore?: number;
  status: OfferStatus;
  expireAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buyer?: SatisfyBuyer;
  isPaid?: boolean;
  isExpired?: boolean;
  isWinner?: boolean;
  item?: Item;
  countPending?: number;
  countWaitingToPay?: number;
  countCompleted?: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemOrder {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  order: Order;
}

export interface Item {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
  orderItems?: ItemOrder[];

};

export interface SatisfyData {
  id: string;
  itemId: string;
  variantId?: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: number;
  amountBefore?: number;
  status: OfferStatus;
  expireAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buyer?: SatisfyBuyer;
  item?: Item;
}

export interface SatisfyDataById {
  id: string;
  itemId: string;
  variantId?: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: number;
  amountBefore?: number;
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSatisfyRequest {
  itemId: string;
  variantId?: string;
  buyerId: string;
  agreedPrice: number;
  status?: OfferStatus;
}

export interface SatisfyListAllResult {
  items: SatisfyDataAll[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  topPrice?: number;
  // Optional counts for monitor-status view
  countPending?: number;
  countWaitingToPay?: number;
  countCompleted?: number;
}

export interface ISatisfyRepository {
  findSatisfies(
    page: number,
    pageSize: number,
    itemId?: string,
    status?: OfferStatus ,
    statusFilter?: string,
  ): Promise<{ satisfies: SatisfyDataAll[]; total: number; topPrice?: number }>;
  findMonitorStatusSatisfy(
    page: number,
    pageSize: number,
    itemId?: string,
    status?: OfferStatus,
    statusFilter?: string,
  ): Promise<{
    satisfies: SatisfyDataAll[];
    total: number;
    topPrice?: number;
    countPending: number;
    countWaitingToPay: number;
    countCompleted: number;
  }>;
  findSatisfyById(itemId: string, buyerId?: string): Promise<SatisfyDataById[]>;
  createSatisfy(
    data: Omit<SatisfyData, "id" | "createdAt" | "updatedAt">
  ): Promise<SatisfyData>;
}

export interface ISatisfyService {
  getSatisfies(page: number, itemId?: string, status?: OfferStatus , statusFilter?: string): Promise<SatisfyListAllResult>;
  getMonitorStatusSatisfies(page: number, itemId?: string, status?: OfferStatus , statusFilter?: string): Promise<SatisfyListAllResult>;
  getSatisfyById(itemId: string, buyerId?: string): Promise<SatisfyDataById[]>;
  createSatisfy(request: CreateSatisfyRequest): Promise<SatisfyData>;
}
