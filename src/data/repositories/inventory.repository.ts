import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IInventoryRepository,
    CreateInventoryLogData,
    InventoryLogData,
} from "../../business/interfaces/inventory.interfaces";

@injectable()
export class InventoryRepository implements IInventoryRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Create a new inventory log entry
     */
    async create(data: CreateInventoryLogData): Promise<InventoryLogData> {
        const inventoryLog = await this.prisma.inventoryLog.create({
            data: {
                itemId: data.itemId,
                variantId: data.variantId,
                action: data.action,
                quantity: data.quantity,
                balance: data.balance,
                reason: data.reason,
                createdById: data.createdById,
            },
        });

        return this.mapToInventoryLogData(inventoryLog);
    }

    /**
     * Find inventory logs by item and optionally by variant
     */
    async findByItem(itemId: string, variantId?: string): Promise<InventoryLogData[]> {
        const where: any = { itemId };
        if (variantId) {
            where.variantId = variantId;
        }

        const inventoryLogs = await this.prisma.inventoryLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return inventoryLogs.map(this.mapToInventoryLogData);
    }

    /**
     * Get current stock for a variant by calculating from inventory logs
     */
    async getCurrentStock(variantId: string): Promise<number> {
        // Get the latest inventory log for this variant
        const latestLog = await this.prisma.inventoryLog.findFirst({
            where: { variantId },
            orderBy: { createdAt: "desc" },
        });

        return latestLog?.balance || 0;
    }

    /**
     * Map Prisma inventory log to InventoryLogData interface
     */
    private mapToInventoryLogData(inventoryLog: any): InventoryLogData {
        return {
            id: inventoryLog.id,
            itemId: inventoryLog.itemId,
            variantId: inventoryLog.variantId,
            action: inventoryLog.action,
            quantity: inventoryLog.quantity,
            balance: inventoryLog.balance,
            reason: inventoryLog.reason,
            createdAt: inventoryLog.createdAt,
            createdById: inventoryLog.createdById,
        };
    }
}