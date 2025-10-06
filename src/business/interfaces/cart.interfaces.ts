import { SellType } from "../../../generated/prisma";

export interface CartItemData {
    id: string;
    userId: string;
    itemId: string;
    variantId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ManageCartItemRequest {
    itemId: string;
    variantId: string;
    quantity: number;
}

export interface CartListRequest {
    sellType?: SellType[];
    page: number;
}

export interface ICartRepository {
    findCartItems(userId: string, sellType?: SellType[], page?: number, pageSize?: number): Promise<CartItemData[]>;
    findCartItem(userId: string, variantId: string): Promise<CartItemData | null>;
    createCartItem(data: Omit<CartItemData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CartItemData>;
    updateCartItem(id: string, quantity: number): Promise<CartItemData>;
    deleteCartItem(id: string): Promise<void>;
}

export interface ICartService {
    getCartItems(userId: string, request: CartListRequest): Promise<any>;
    getSatisfyItems(page: number, pageSize: number): Promise<any>;
    getAuctionItems(page: number, pageSize: number, userId: string): Promise<any>;
    manageCartItem(userId: string, request: ManageCartItemRequest): Promise<string>;
}
