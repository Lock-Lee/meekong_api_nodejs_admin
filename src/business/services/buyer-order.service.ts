import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { OrderStatus } from "../../../generated/prisma";
import { IBuyerOrderRepository , IBuyerOrderService , BuyerOrderData } from "../interfaces/buyer-order.interfaces";
import { Logger } from "@utils/logger";

@injectable()
export class BuyerOrderService implements IBuyerOrderService {
    constructor(
        @inject(TYPES.BuyerOrderRepository) private buyerOrderRepository: IBuyerOrderRepository
    ) { }

    /**
     * Get buyer order by status
     * @param userId 
     * @param status 
     * @returns 
     */
    getBuyerOrderByStatus(userId: string, status: OrderStatus): Promise<BuyerOrderData[]> {
        Logger.info("Fetching buyer orders by status");
        return this.buyerOrderRepository.findBuyerOrderByStatus(userId, status);
    }

    /**
     * Get all buyer order summary
     * @param userId 
     * @returns 
     */
    async getAllBuyerOrderSummary(userId: string): Promise<BuyerOrderData[]> {
         try {
            Logger.info("Fetching all buyer orders summary");
            return await this.buyerOrderRepository.findAllBuyerOrderSummary(userId);
        } catch (error) {
            Logger.error("Failed to fetch buyer orders", { error });
            throw error;
        }
    }
}
