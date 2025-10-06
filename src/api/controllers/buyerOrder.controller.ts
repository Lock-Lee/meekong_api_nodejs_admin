import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerOrderService } from "../../business/interfaces/buyer-order.interfaces";
import { BusinessError } from "../../shared/errors/business.errors";
import { OrderStatus } from "../../../generated/prisma";

@injectable()
export class BuyerOrderController {
    private buyerOrderService: IBuyerOrderService;
    constructor() {
        this.buyerOrderService = container.get<IBuyerOrderService>(TYPES.BuyerOrderService);
    }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            Logger.info("Fetching all buyer orders", { requestId: req.id });

            const userId = req.userId as string;
            if (!userId) {
                Logger.warn("User ID is missing", { requestId: req.id });
                return Send.error(res, null, "User ID is missing.");
            }

            Logger.info(`Fetching orders for user: ${userId}`, { requestId: req.id });

            const buyerOrders = await this.buyerOrderService.getAllBuyerOrderSummary(userId);

            Logger.info("Buyer orders retrieved successfully", {
                requestId: req.id,
                buyerOrdersCount: buyerOrders?.length || 0,
            });

            Send.success(res, {
                requestId: req.id,
                data: buyerOrders,
            });
        } catch (error) {
            Logger.error("Failed to fetch buyer orders", {
                requestId: req.id,
                error: error instanceof Error ? error.message : "Unknown error"
            });

            if (error instanceof BusinessError) {
                Send.error(res, error, error.message);
            } else {
                Send.error(res, error, "Failed to fetch buyer orders.");
            }
        }
    }
    async getByStatus(req: Request, res: Response): Promise<void> {
        try {
            Logger.info("Fetching buyer orders by status", { requestId: req.id });
            const userId = req.userId as string;
            const status = req.params.status as OrderStatus;

            if (!userId) {
                Logger.warn("User ID is missing", { requestId: req.id });
                return Send.error(res, null, "User ID is missing.");
            }

            if (!status) {
                Logger.warn("Status is missing", { requestId: req.id });
                return Send.error(res, null, "Status is missing.");
            }

            const buyerOrders = await this.buyerOrderService.getBuyerOrderByStatus(userId, status);

            Logger.info("Buyer orders retrieved successfully", {
                requestId: req.id,
                buyerOrdersCount: buyerOrders.length,
            });

            Send.success(res, {
                requestId: req.id,
                data: buyerOrders,
            });
        } catch (error) {
            Logger.error("Failed to fetch buyer orders by status", {
                requestId: req.id,
                error: error instanceof Error ? error.message : "Unknown error"
            });
            if (error instanceof BusinessError) {
                Send.error(res, error, error.message);
            } else {
                Send.error(res, error, "Failed to fetch buyer orders by status.");
            }
        }
    }
}

