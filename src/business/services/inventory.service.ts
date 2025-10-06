import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { InventoryAction } from "../../../generated/prisma";
import {
    IInventoryService,
    IInventoryRepository,
    CreateInventoryLogData,
    InventoryLogData,
} from "../interfaces/inventory.interfaces";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class InventoryService implements IInventoryService {
    constructor(
        @inject(TYPES.InventoryRepository) private inventoryRepository: IInventoryRepository
    ) { }

    /**
     * Log an inventory change
     */
    async logInventoryChange(data: CreateInventoryLogData): Promise<InventoryLogData> {
        Logger.info(`Logging inventory change for variant ${data.variantId}: ${data.action} ${data.quantity}`);

        try {
            return await this.inventoryRepository.create(data);
        } catch (error) {
            Logger.error("Failed to log inventory change", error);
            throw new BusinessError("Failed to log inventory change");
        }
    }

    /**
     * Get inventory history for an item or specific variant
     */
    async getInventoryHistory(itemId: string, variantId?: string): Promise<InventoryLogData[]> {
        Logger.info(`Fetching inventory history for item ${itemId}${variantId ? `, variant ${variantId}` : ''}`);

        try {
            return await this.inventoryRepository.findByItem(itemId, variantId);
        } catch (error) {
            Logger.error("Failed to fetch inventory history", error);
            throw new BusinessError("Failed to fetch inventory history");
        }
    }

    /**
     * Get current stock for a variant
     */
    async getCurrentStock(variantId: string): Promise<number> {
        try {
            return await this.inventoryRepository.getCurrentStock(variantId);
        } catch (error) {
            Logger.error(`Failed to get current stock for variant ${variantId}`, error);
            throw new BusinessError("Failed to get current stock");
        }
    }

    /**
     * Adjust stock for a variant (manual adjustment)
     */
    async adjustStock(
        variantId: string,
        newQuantity: number,
        reason: string,
        userId?: string
    ): Promise<InventoryLogData> {
        Logger.info(`Adjusting stock for variant ${variantId} to ${newQuantity}`);

        if (newQuantity < 0) {
            throw new BusinessError("Stock quantity cannot be negative");
        }

        try {
            const currentStock = await this.getCurrentStock(variantId);
            const difference = newQuantity - currentStock;
            const action = difference > 0 ? InventoryAction.ADD : InventoryAction.REMOVE;
            const quantity = Math.abs(difference);

            if (difference === 0) {
                Logger.info(`No stock adjustment needed for variant ${variantId}`);
                // Return the latest log entry
                const history = await this.getInventoryHistory('', variantId);
                return history[0];
            }

            const logData: CreateInventoryLogData = {
                itemId: '', // Will be filled by the caller if needed
                variantId,
                action,
                quantity,
                balance: newQuantity,
                reason,
                createdById: userId,
            };

            return await this.logInventoryChange(logData);
        } catch (error) {
            Logger.error(`Failed to adjust stock for variant ${variantId}`, error);
            throw new BusinessError("Failed to adjust stock");
        }
    }
}