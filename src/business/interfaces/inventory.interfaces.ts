import { InventoryAction } from "../../../generated/prisma";

// Inventory Log interfaces
export interface InventoryLogData {
    id: string;
    itemId: string;
    variantId: string;
    action: InventoryAction;
    quantity: number;
    balance: number;
    reason?: string;
    createdAt: Date;
    createdById?: string;
}

export interface CreateInventoryLogData {
    itemId: string;
    variantId: string;
    action: InventoryAction;
    quantity: number;
    balance: number;
    reason?: string;
    createdById?: string;
}

// Service interfaces
export interface IInventoryService {
    logInventoryChange(data: CreateInventoryLogData): Promise<InventoryLogData>;
    getInventoryHistory(itemId: string, variantId?: string): Promise<InventoryLogData[]>;
    getCurrentStock(variantId: string): Promise<number>;
    adjustStock(variantId: string, newQuantity: number, reason: string, userId?: string): Promise<InventoryLogData>;
}

// Repository interfaces
export interface IInventoryRepository {
    create(data: CreateInventoryLogData): Promise<InventoryLogData>;
    findByItem(itemId: string, variantId?: string): Promise<InventoryLogData[]>;
    getCurrentStock(variantId: string): Promise<number>;
}
