import { Decimal } from "@prisma/client/runtime/library";
import { OrderStatus } from "../../../generated/prisma";


export interface BuyerOrderDataItem {
    id: string;
    orderId: string;
    itemId: string;
    variantId: string;
    shopId: string;
    quantity: number;
    unitPrice: Decimal;
    subTotal: Decimal;
    commissionRate: Decimal;
    commissionFee: Decimal;
}

export interface BuyerOrderData {
    id: string;
    buyerId: string;
    subtotal: Decimal;
    shippingCost: Decimal;
    commissionFee: Decimal;
    totalAmount: Decimal;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    items: BuyerOrderDataItem[];
}





export interface IBuyerOrderRepository {
    findBuyerOrderByStatus(userId: string, status: OrderStatus): Promise<BuyerOrderData[]>
    findAllBuyerOrderSummary(userId: string): Promise<BuyerOrderData[]>
}

export interface IBuyerOrderService {
    getBuyerOrderByStatus(userId: string, status: OrderStatus): Promise<BuyerOrderData[]>
    getAllBuyerOrderSummary(userId: string): Promise<BuyerOrderData[]>
}


