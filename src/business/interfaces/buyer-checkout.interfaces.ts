



// --- Checkout Process ---

export interface CheckoutItem {
    itemId: string;
    variantId: string;
    quantity: number;
    price: number;
    shopId: string;
}

export interface CheckoutRequest {
    buyerId: string;
    shopId: string;
    items: CheckoutItem[];
    addressId: string;
    paymentMethod: string;
    totalAmount: number;
    userId: string;
    subtotal: number;
    shippingCost: number;
    commissionFee: number;
    shippingAddress: string;
}

export interface CheckoutResult {
    orderId: string;
    status: string; // เช่น 'PENDING', 'PAID', etc.
    removedCartItemIds: string[];
    updatedVariants: {
        variantId: string;
        newStock: number;
    }[];
    inventoryLogs: {
        itemId: string;
        variantId: string;
        action: 'REMOVE';
        quantity: number;
        balance: number;
        reason?: string;
    }[];
}


export interface UpdateOrderStatusRequest {
    orderId: string;
    status: string;
}

export interface UpdateOrderStatusResult {
    orderId: string;
    status: string;
    updatedAt: Date;
}

export interface IBuyerCheckoutRepository {
    checkout(data: CheckoutRequest): Promise<CheckoutResult>;
    updateOrderStatus(data: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResult>;
}

export interface IBuyerCheckoutService {
    checkout(data: CheckoutRequest): Promise<CheckoutResult>;
    updateOrderStatusToPaid(orderId: string): Promise<UpdateOrderStatusResult>;
}
